from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


ProjectStatus = Literal[
    "draft",
    "sources_ready",
    "brief_ready",
    "planning_ready",
    "planning_ready",
    "svg_ready",
    "exporting",
    "exported",
    "failed",
]


ProjectLogLevel = Literal["info", "success", "warning", "error"]


class ModelProvider(BaseModel):
    id: str
    provider_name: str
    display_name: str
    base_url: str
    api_key: str = ""
    model_name: str
    stage_mapping: dict[str, str] = Field(default_factory=dict)
    enabled: bool = True


class ModelValidationResponse(BaseModel):
    profile_id: str
    ok: bool
    message: str


class ProjectCreate(BaseModel):
    name: str
    language: str = "zh-CN"
    output_format: str = "ppt169"
    template_strategy: str = "template_light"
    input_mode: Literal["file_mode", "intent_mode"]
    model_profile_id: str | None = None


class BriefPayload(BaseModel):
    audience: str
    goal: str
    scenario: str
    style: str
    page_count: int = 10
    must_have: list[str] = Field(default_factory=list)
    avoid: list[str] = Field(default_factory=list)
    source_text: str = ""


class SourceAsset(BaseModel):
    kind: Literal["upload", "url", "text"]
    name: str
    original_value: str
    stored_path: str | None = None
    normalized_markdown_path: str | None = None


class SourceImportRequest(BaseModel):
    urls: list[str] = Field(default_factory=list)
    pasted_text: str = ""
    pasted_text_name: str = "pasted-notes.txt"


class SourceImportResponse(BaseModel):
    project_id: str
    imported: list[SourceAsset] = Field(default_factory=list)
    archived: list[str] = Field(default_factory=list)
    markdown: list[str] = Field(default_factory=list)
    assets: list[str] = Field(default_factory=list)
    notes: list[str] = Field(default_factory=list)
    skipped: list[str] = Field(default_factory=list)


class PlanSlide(BaseModel):
    page: int
    title: str
    objective: str
    bullets: list[str]
    visual_hint: str


class ProjectLogEntry(BaseModel):
    timestamp: datetime
    stage: str
    level: ProjectLogLevel = "info"
    message: str


class DesignSpecPayload(BaseModel):
    theme: str = ""
    style_objective: str = ""
    color_scheme: str = ""
    typography: str = ""
    imagery: str = ""
    page_count_strategy: str = ""
    notes: str = ""


class ProjectRecord(BaseModel):
    id: str
    name: str
    language: str
    output_format: str
    template_strategy: str
    input_mode: str
    model_profile_id: str | None = None
    status: ProjectStatus = "draft"
    created_at: datetime
    updated_at: datetime
    last_exported_at: datetime | None = None
    project_path: str
    brief: BriefPayload | None = None
    sources: list[SourceAsset] = Field(default_factory=list)
    outline: list[str] = Field(default_factory=list)
    slides: list[PlanSlide] = Field(default_factory=list)
    design_spec: DesignSpecPayload = Field(default_factory=DesignSpecPayload)
    logs: list[ProjectLogEntry] = Field(default_factory=list)
    export_file: str | None = None


class ProjectSummary(BaseModel):
    id: str
    name: str
    status: ProjectStatus
    output_format: str
    input_mode: str
    updated_at: datetime
    last_exported_at: datetime | None = None


class ProjectLogsResponse(BaseModel):
    project_id: str
    logs: list[ProjectLogEntry] = Field(default_factory=list)


class PlanningResponse(BaseModel):
    project: ProjectRecord
    design_spec: DesignSpecPayload


class ExportResponse(BaseModel):
    project_id: str
    pptx_path: str


class SlidePreview(BaseModel):
    filename: str
    svg_content: str