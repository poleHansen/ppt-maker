from __future__ import annotations

import json
from datetime import datetime
from pathlib import Path
from uuid import uuid4

from app.core.settings import get_settings
from app.models.schemas import ProjectCreate, ProjectRecord, ProjectSummary


class ProjectRepository:
    def __init__(self) -> None:
        settings = get_settings()
        self.projects_root = settings.projects_root
        self.projects_root.mkdir(parents=True, exist_ok=True)

    def _record_path(self, project_id: str) -> Path:
        return self.projects_root / project_id / "project.json"

    def create(self, payload: ProjectCreate, project_path: Path) -> ProjectRecord:
        now = datetime.utcnow()
        project_id = uuid4().hex[:12]
        root = self.projects_root / project_id
        root.mkdir(parents=True, exist_ok=True)
        record = ProjectRecord(
            id=project_id,
            name=payload.name,
            language=payload.language,
            output_format=payload.output_format,
            template_strategy=payload.template_strategy,
            input_mode=payload.input_mode,
            model_profile_id=payload.model_profile_id,
            created_at=now,
            updated_at=now,
            project_path=str(project_path),
        )
        self.save(record)
        return record

    def save(self, record: ProjectRecord) -> None:
        path = self._record_path(record.id)
        path.parent.mkdir(parents=True, exist_ok=True)
        record.updated_at = datetime.utcnow()
        path.write_text(record.model_dump_json(indent=2), encoding="utf-8")

    def get(self, project_id: str) -> ProjectRecord:
        path = self._record_path(project_id)
        return ProjectRecord.model_validate_json(path.read_text(encoding="utf-8"))

    def list(self) -> list[ProjectSummary]:
        items: list[ProjectSummary] = []
        for path in sorted(self.projects_root.glob("*/project.json")):
            record = ProjectRecord.model_validate_json(path.read_text(encoding="utf-8"))
            items.append(
                ProjectSummary(
                    id=record.id,
                    name=record.name,
                    status=record.status,
                    output_format=record.output_format,
                    input_mode=record.input_mode,
                    updated_at=record.updated_at,
                    last_exported_at=record.last_exported_at,
                )
            )
        return sorted(items, key=lambda item: item.updated_at, reverse=True)