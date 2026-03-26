from __future__ import annotations

from pathlib import Path

from app.core.settings import get_settings
from app.models.schemas import ModelProvider


DEFAULT_PROFILES = [
    ModelProvider(
        id="openai-default",
        provider_name="openai",
        display_name="OpenAI 兼容默认配置",
        base_url="https://api.openai.com/v1",
        api_key="",
        model_name="gpt-4.1-mini",
        stage_mapping={"brief": "gpt-4.1-mini", "planning": "gpt-4.1-mini", "export": "gpt-4.1-mini"},
        enabled=True,
    ),
    ModelProvider(
        id="deepseek-default",
        provider_name="deepseek",
        display_name="DeepSeek 默认配置",
        base_url="https://api.deepseek.com/v1",
        api_key="",
        model_name="deepseek-chat",
        stage_mapping={"brief": "deepseek-chat", "planning": "deepseek-chat", "export": "deepseek-chat"},
        enabled=True,
    ),
]


class ModelProfileRepository:
    def __init__(self) -> None:
        settings = get_settings()
        self.config_root = settings.config_root
        self.config_root.mkdir(parents=True, exist_ok=True)
        self.file_path = self.config_root / "model_profiles.json"
        if not self.file_path.exists():
            self.save_all(DEFAULT_PROFILES)

    def list(self) -> list[ModelProvider]:
        return [ModelProvider.model_validate(item) for item in self._read()]

    def save_all(self, profiles: list[ModelProvider]) -> list[ModelProvider]:
        self.file_path.write_text(
            "[\n" + ",\n".join(profile.model_dump_json(indent=2) for profile in profiles) + "\n]",
            encoding="utf-8",
        )
        return profiles

    def upsert(self, profile: ModelProvider) -> list[ModelProvider]:
        profiles = self.list()
        replaced = False
        for index, item in enumerate(profiles):
            if item.id == profile.id:
                profiles[index] = profile
                replaced = True
                break
        if not replaced:
            profiles.append(profile)
        return self.save_all(profiles)

    def _read(self) -> list[dict]:
        return __import__("json").loads(self.file_path.read_text(encoding="utf-8"))