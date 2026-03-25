from __future__ import annotations

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse

from app.models.schemas import BriefPayload, DesignSpecPayload, ExportResponse, ModelProvider, ModelValidationResponse, PlanningResponse, ProjectCreate, ProjectLogsResponse, ProjectRecord, ProjectSummary, SlidePreview, SourceImportRequest, SourceImportResponse
from app.services.model_profile_service import ModelProfileService
from app.services.project_service import ProjectService


router = APIRouter()
service = ProjectService()
model_profile_service = ModelProfileService()


@router.get("/projects", response_model=list[ProjectSummary])
def list_projects() -> list[ProjectSummary]:
    return service.list_projects()


@router.post("/projects", response_model=ProjectRecord)
def create_project(payload: ProjectCreate) -> ProjectRecord:
    try:
        return service.create_project(payload)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("/projects/{project_id}", response_model=ProjectRecord)
def get_project(project_id: str) -> ProjectRecord:
    try:
        return service.get_project(project_id)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail="项目不存在") from exc


@router.get("/projects/{project_id}/logs", response_model=ProjectLogsResponse)
def get_project_logs(project_id: str) -> ProjectLogsResponse:
    try:
        return service.get_logs(project_id)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail="项目不存在") from exc


@router.post("/projects/{project_id}/brief", response_model=ProjectRecord)
def save_brief(project_id: str, payload: BriefPayload) -> ProjectRecord:
    try:
        return service.save_brief(project_id, payload)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/projects/{project_id}/plan", response_model=PlanningResponse)
def generate_plan(project_id: str) -> PlanningResponse:
    try:
        return service.generate_plan(project_id)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.put("/projects/{project_id}/design-spec", response_model=ProjectRecord)
def update_design_spec(project_id: str, payload: DesignSpecPayload) -> ProjectRecord:
    try:
        return service.update_design_spec(project_id, payload)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("/projects/{project_id}/previews", response_model=list[SlidePreview])
def list_previews(project_id: str) -> list[SlidePreview]:
    try:
        return service.list_previews(project_id)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/projects/{project_id}/export", response_model=ExportResponse)
def export_project(project_id: str) -> ExportResponse:
    try:
        return service.export(project_id)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("/projects/{project_id}/export/download")
def download_export(project_id: str) -> FileResponse:
    try:
        export_file = service.get_export_file(project_id)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return FileResponse(export_file, media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation", filename=export_file.name)


@router.post("/projects/{project_id}/sources", response_model=SourceImportResponse)
async def import_sources(
    project_id: str,
    urls: str = Form(default="[]"),
    pasted_text: str = Form(default=""),
    pasted_text_name: str = Form(default="pasted-notes.txt"),
    files: list[UploadFile] = File(default_factory=list),
) -> SourceImportResponse:
    try:
        uploaded_files: list[tuple[str, bytes]] = []
        for file in files:
            uploaded_files.append((file.filename or "uploaded-file", await file.read()))
        payload = SourceImportRequest.model_validate_json(
            '{"urls": ' + urls + ', "pasted_text": ' + __import__("json").dumps(pasted_text) + ', "pasted_text_name": ' + __import__("json").dumps(pasted_text_name) + '}'
        )
        return service.import_sources(project_id, payload, uploaded_files)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("/model-profiles", response_model=list[ModelProvider])
def list_model_profiles() -> list[ModelProvider]:
    return model_profile_service.list_profiles()


@router.put("/model-profiles", response_model=list[ModelProvider])
def save_model_profile(payload: ModelProvider) -> list[ModelProvider]:
    try:
        return model_profile_service.save_profile(payload)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/model-profiles/validate", response_model=ModelValidationResponse)
def validate_model_profile(payload: ModelProvider) -> ModelValidationResponse:
    return model_profile_service.validate_profile(payload)