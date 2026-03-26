from __future__ import annotations

from app.models.schemas import ModelProvider, ModelValidationResponse
from app.repositories.model_profile_repository import ModelProfileRepository
from app.services.llm_gateway import LlmGateway


class ModelProfileService:
    def __init__(self) -> None:
        self.repository = ModelProfileRepository()
        self.gateway = LlmGateway()

    def list_profiles(self) -> list[ModelProvider]:
        return [self._mask_profile(profile) for profile in self.repository.list()]

    def save_profile(self, payload: ModelProvider) -> list[ModelProvider]:
        profiles = self.repository.upsert(payload)
        return [self._mask_profile(profile) for profile in profiles]

    def validate_profile(self, payload: ModelProvider) -> ModelValidationResponse:
        if not payload.base_url.strip():
            return ModelValidationResponse(profile_id=payload.id, ok=False, message="Base URL 不能为空")
        if not payload.api_key.strip():
            return ModelValidationResponse(profile_id=payload.id, ok=False, message="API Key 不能为空")
        if not payload.model_name.strip():
            return ModelValidationResponse(profile_id=payload.id, ok=False, message="模型名称不能为空")
        if not payload.provider_name.strip():
            return ModelValidationResponse(profile_id=payload.id, ok=False, message="供应商名称不能为空")
        try:
            result = self.gateway.invoke_text(payload, "Reply with OK only.")
        except Exception as exc:
            return ModelValidationResponse(
                profile_id=payload.id,
                ok=False,
                message=str(exc),
                provider_name=payload.provider_name,
                resolved_model=payload.model_name,
            )

        preview = result.content.replace("\n", " ").strip()
        if len(preview) > 80:
            preview = f"{preview[:77]}..."
        return ModelValidationResponse(
            profile_id=payload.id,
            ok=True,
            message=f"连接成功，模型返回: {preview}",
            provider_name=result.provider_name,
            resolved_model=result.model_name,
            latency_ms=result.latency_ms,
        )

    def _mask_profile(self, profile: ModelProvider) -> ModelProvider:
        return profile.model_copy(update={"api_key": self._mask_api_key(profile.api_key)})

    def _mask_api_key(self, api_key: str) -> str:
        token = api_key.strip()
        if not token:
            return ""
        if len(token) <= 8:
            return "*" * len(token)
        return f"{token[:4]}{'*' * (len(token) - 8)}{token[-4:]}"