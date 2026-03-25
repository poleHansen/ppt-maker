from __future__ import annotations

from app.models.schemas import ModelProvider, ModelValidationResponse
from app.repositories.model_profile_repository import ModelProfileRepository


class ModelProfileService:
    def __init__(self) -> None:
        self.repository = ModelProfileRepository()

    def list_profiles(self) -> list[ModelProvider]:
        return self.repository.list()

    def save_profile(self, payload: ModelProvider) -> list[ModelProvider]:
        return self.repository.upsert(payload)

    def validate_profile(self, payload: ModelProvider) -> ModelValidationResponse:
        if not payload.base_url.strip():
            return ModelValidationResponse(profile_id=payload.id, ok=False, message="Base URL 不能为空")
        if not payload.model_name.strip():
            return ModelValidationResponse(profile_id=payload.id, ok=False, message="模型名称不能为空")
        if not payload.provider_name.strip():
            return ModelValidationResponse(profile_id=payload.id, ok=False, message="供应商名称不能为空")
        return ModelValidationResponse(profile_id=payload.id, ok=True, message="配置结构校验通过，可用于后续接入真实连通性测试")