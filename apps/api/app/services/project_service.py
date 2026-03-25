from __future__ import annotations

import tempfile
import shutil
from datetime import datetime
from pathlib import Path

from app.adapters.ppt_master.adapter import PptMasterAdapter
from app.core.settings import get_settings
from app.models.schemas import BriefPayload, DesignSpecPayload, ExportResponse, PlanningResponse, ProjectCreate, ProjectLogEntry, ProjectLogsResponse, ProjectRecord, SlidePreview, SourceAsset, SourceImportRequest, SourceImportResponse
from app.repositories.project_repository import ProjectRepository
from app.services.planner_service import PlannerService
from app.services.svg_service import SvgService


class ProjectService:
    def __init__(self) -> None:
        self.settings = get_settings()
        self.repository = ProjectRepository()
        self.planner = PlannerService()
        self.svg_service = SvgService()
        self.ppt_master = PptMasterAdapter()
        self.settings.templates_root.mkdir(parents=True, exist_ok=True)
        self.ppt_master.sync_template_assets(self.settings.templates_root)

    def create_project(self, payload: ProjectCreate) -> ProjectRecord:
        project_path = self.ppt_master.init_project(payload.name, payload.output_format, self.settings.projects_root)
        record = self.repository.create(payload, project_path)
        self._append_log(record, stage="project", message="项目已创建并初始化目录", level="success")
        self.repository.save(record)
        return record

    def list_projects(self):
        return self.repository.list()

    def get_project(self, project_id: str) -> ProjectRecord:
        return self.repository.get(project_id)

    def save_brief(self, project_id: str, brief: BriefPayload) -> ProjectRecord:
        record = self.repository.get(project_id)
        record.brief = brief
        record.status = "brief_ready"
        self._append_log(record, stage="brief", message="需求简报已保存", level="success")
        self.repository.save(record)
        return record

    def generate_plan(self, project_id: str) -> PlanningResponse:
        record = self.repository.get(project_id)
        if record.brief is None:
            raise ValueError("请先提交需求简报")
        record.outline = self.planner.build_outline(record.brief)
        record.slides = self.planner.build_slides(record.brief)
        record.design_spec = self._build_design_spec(record.brief, record.output_format)
        record.status = "planning_ready"
        self._append_log(record, stage="planning", message="已生成大纲、页级规划和设计规格", level="success")
        self.svg_service.generate(record)
        record.status = "svg_ready"
        self._append_log(record, stage="svg", message="SVG 草稿已生成", level="success")
        self.repository.save(record)
        return PlanningResponse(project=record, design_spec=record.design_spec)

    def list_previews(self, project_id: str) -> list[SlidePreview]:
        record = self.repository.get(project_id)
        return [SlidePreview(filename=name, svg_content=content) for name, content in self.svg_service.list_previews(record)]

    def export(self, project_id: str) -> ExportResponse:
        record = self.repository.get(project_id)
        record.status = "exporting"
        self._append_log(record, stage="export", message="开始执行导出流程", level="info")
        self.repository.save(record)

        try:
            project_path = Path(record.project_path)
            for stage_name, command in self.ppt_master.export_steps(project_path):
                self._append_log(record, stage="export", message=f"开始执行步骤：{stage_name}", level="info")
                self.repository.save(record)
                self.ppt_master._run(command)
                self._append_log(record, stage="export", message=f"步骤完成：{stage_name}", level="success")
                self.repository.save(record)

            pptx_files = sorted(project_path.glob("*.pptx"), key=lambda item: item.stat().st_mtime, reverse=True)
            if not pptx_files:
                raise RuntimeError("导出完成但未找到 PPTX 文件")
            pptx_path = pptx_files[0]
            target = self.settings.exports_root / f"{project_id}.pptx"
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(pptx_path, target)
            record.export_file = str(target)
            record.status = "exported"
            record.last_exported_at = datetime.utcnow()
            self._append_log(record, stage="export", message="PPTX 导出完成", level="success")
            self.repository.save(record)
            return ExportResponse(project_id=project_id, pptx_path=str(target))
        except Exception as exc:
            record.status = "failed"
            self._append_log(record, stage="export", message=f"PPTX 导出失败：{exc}", level="error")
            self.repository.save(record)
            raise

    def get_export_file(self, project_id: str) -> Path:
        record = self.repository.get(project_id)
        if not record.export_file:
            raise FileNotFoundError("项目尚未导出 PPTX")
        export_path = Path(record.export_file)
        if not export_path.exists():
            raise FileNotFoundError("导出文件不存在")
        return export_path

    def import_sources(self, project_id: str, payload: SourceImportRequest, uploaded_files: list[tuple[str, bytes]]) -> SourceImportResponse:
        record = self.repository.get(project_id)
        temp_dir = Path(tempfile.mkdtemp(prefix=f"ppt-maker-{project_id}-", dir=self.settings.storage_root))
        source_items: list[str] = []
        imported_assets: list[SourceAsset] = []

        try:
            for original_name, content in uploaded_files:
                temp_path = temp_dir / original_name
                temp_path.parent.mkdir(parents=True, exist_ok=True)
                temp_path.write_bytes(content)
                source_items.append(str(temp_path))
                imported_assets.append(
                    SourceAsset(kind="upload", name=original_name, original_value=original_name, stored_path=str(temp_path))
                )

            for url in payload.urls:
                if url.strip():
                    source_items.append(url.strip())
                    imported_assets.append(SourceAsset(kind="url", name=url.strip(), original_value=url.strip()))

            if payload.pasted_text.strip():
                text_name = payload.pasted_text_name.strip() or "pasted-notes.txt"
                if not text_name.lower().endswith(".txt"):
                    text_name = f"{text_name}.txt"
                temp_path = temp_dir / text_name
                temp_path.write_text(payload.pasted_text, encoding="utf-8")
                source_items.append(str(temp_path))
                imported_assets.append(
                    SourceAsset(kind="text", name=text_name, original_value=payload.pasted_text, stored_path=str(temp_path))
                )

            if not source_items:
                raise ValueError("请至少上传一个文件、输入一个 URL 或粘贴一段文本")

            summary = self.ppt_master.import_sources(Path(record.project_path), source_items, move=True)

            markdown_paths = summary.get("markdown", [])
            for index, asset in enumerate(imported_assets):
                if index < len(markdown_paths):
                    asset.normalized_markdown_path = markdown_paths[index]

            record.sources.extend(imported_assets)
            record.status = "sources_ready"
            self._append_log(record, stage="sources", message=f"已导入 {len(imported_assets)} 项资料", level="success")
            if payload.pasted_text.strip():
                merged_text = payload.pasted_text.strip()
                if record.brief is None:
                    record.brief = BriefPayload(audience="", goal="", scenario="", style="", source_text=merged_text)
                else:
                    existing = record.brief.source_text.strip()
                    record.brief.source_text = f"{existing}\n\n{merged_text}".strip() if existing else merged_text
            self.repository.save(record)

            return SourceImportResponse(
                project_id=project_id,
                imported=imported_assets,
                archived=summary.get("archived", []),
                markdown=summary.get("markdown", []),
                assets=summary.get("assets", []),
                notes=summary.get("notes", []),
                skipped=summary.get("skipped", []),
            )
        finally:
            shutil.rmtree(temp_dir, ignore_errors=True)

    def get_logs(self, project_id: str) -> ProjectLogsResponse:
        record = self.repository.get(project_id)
        return ProjectLogsResponse(project_id=project_id, logs=record.logs)

    def update_design_spec(self, project_id: str, payload: DesignSpecPayload) -> ProjectRecord:
        record = self.repository.get(project_id)
        record.design_spec = payload
        self._append_log(record, stage="design_spec", message="设计规格已更新", level="success")
        self.repository.save(record)
        return record

    def _build_design_spec(self, brief: BriefPayload, output_format: str) -> DesignSpecPayload:
        generated = self.planner.build_design_spec(brief, output_format)
        return DesignSpecPayload(
            theme=generated.get("theme", ""),
            style_objective=generated.get("style_objective", ""),
            color_scheme=generated.get("color_scheme", ""),
            typography=generated.get("typography", ""),
            imagery=generated.get("imagery", ""),
            page_count_strategy=generated.get("page_count_strategy", ""),
            notes=generated.get("notes", ""),
        )

    def _append_log(self, record: ProjectRecord, stage: str, message: str, level: str = "info") -> None:
        record.logs.append(ProjectLogEntry(timestamp=datetime.utcnow(), stage=stage, level=level, message=message))