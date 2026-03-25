from __future__ import annotations

import json
import shutil
import subprocess
import sys
from pathlib import Path

from app.core.settings import get_settings


class PptMasterAdapter:
    def __init__(self) -> None:
        settings = get_settings()
        self.scripts_root = settings.ppt_master_scripts_root
        self.templates_root = settings.ppt_master_templates_root
        self.repo_root = settings.ppt_master_root

    def init_project(self, name: str, output_format: str, target_root: Path) -> Path:
        project_manager = self.scripts_root / "project_manager.py"
        self._run([
            sys.executable,
            str(project_manager),
            "init",
            name,
            "--format",
            output_format,
            "--dir",
            str(target_root),
        ])
        matches = sorted(target_root.glob(f"{name}_{output_format}_*"), reverse=True)
        if not matches:
            raise RuntimeError("未找到初始化后的项目目录")
        return matches[0]

    def sync_template_assets(self, target_templates_root: Path) -> None:
        target_templates_root.mkdir(parents=True, exist_ok=True)
        for folder_name in ("layouts", "charts", "icons"):
            source = self.templates_root / folder_name
            target = target_templates_root / folder_name
            if target.exists():
                continue
            shutil.copytree(source, target)

    def export_steps(self, project_path: Path) -> list[tuple[str, list[str]]]:
        return [
            ("split_notes", [sys.executable, str(self.scripts_root / "total_md_split.py"), str(project_path)]),
            ("finalize_svg", [sys.executable, str(self.scripts_root / "finalize_svg.py"), str(project_path)]),
            ("export_pptx", [sys.executable, str(self.scripts_root / "svg_to_pptx.py"), str(project_path), "-s", "final"]),
        ]

    def export_project(self, project_path: Path) -> Path:
        for _, command in self.export_steps(project_path):
            self._run(command)
        pptx_files = sorted(project_path.glob("*.pptx"), key=lambda item: item.stat().st_mtime, reverse=True)
        if not pptx_files:
            raise RuntimeError("导出完成但未找到 PPTX 文件")
        return pptx_files[0]

    def import_sources(self, project_path: Path, source_items: list[str], move: bool = False) -> dict[str, list[str]]:
        if not source_items:
            return {"archived": [], "markdown": [], "assets": [], "notes": [], "skipped": []}

        command = [
            sys.executable,
            str(self.scripts_root / "project_manager.py"),
            "import-sources",
            str(project_path),
            *source_items,
        ]
        if move:
            command.append("--move")
        result = self._run(command)
        return self._parse_import_summary(result.stdout)

    def _run(self, command: list[str]) -> subprocess.CompletedProcess[str]:
        result = subprocess.run(
            command,
            cwd=self.repo_root,
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
        )
        if result.returncode != 0:
            detail = result.stderr.strip() or result.stdout.strip() or "ppt-master 执行失败"
            raise RuntimeError(detail)
        return result

    def _parse_import_summary(self, stdout: str) -> dict[str, list[str]]:
        summary = {"archived": [], "markdown": [], "assets": [], "notes": [], "skipped": []}
        current_key: str | None = None
        header_map = {
            "Archived originals / URL records:": "archived",
            "Normalized markdown:": "markdown",
            "Imported asset directories:": "assets",
            "Notes:": "notes",
            "Skipped:": "skipped",
        }

        for raw_line in stdout.splitlines():
            line = raw_line.strip()
            if not line:
                continue
            if line in header_map:
                current_key = header_map[line]
                continue
            if line.startswith("[OK]"):
                continue
            if line.startswith("- ") and current_key:
                summary[current_key].append(line[2:].strip())
                continue
            if line.startswith("-") and current_key:
                summary[current_key].append(line[1:].strip())
                continue
            if line.startswith("#"):
                continue
            if line.startswith("{"):
                try:
                    payload = json.loads(line)
                except json.JSONDecodeError:
                    continue
                for key in summary:
                    summary[key].extend(payload.get(key, []))
        return summary