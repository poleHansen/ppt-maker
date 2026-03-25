from functools import lru_cache
from pathlib import Path

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="PPT_MAKER_", extra="ignore")

    app_name: str = "PPT Maker API"
    cors_origins: list[str] = ["http://localhost:3000"]
    workspace_root: Path = Path(__file__).resolve().parents[4]
    storage_root: Path = workspace_root / "storage"
    projects_root: Path = storage_root / "projects"
    exports_root: Path = storage_root / "exports"
    config_root: Path = storage_root / "config"
    templates_root: Path = workspace_root / "assets" / "svg-templates"
    ppt_master_root: Path = Path("D:/code/ppt-master")
    ppt_master_scripts_root: Path = ppt_master_root / "skills" / "ppt-master" / "scripts"
    ppt_master_templates_root: Path = ppt_master_root / "skills" / "ppt-master" / "templates"

    @field_validator("workspace_root", "storage_root", "projects_root", "exports_root", "config_root", "templates_root", mode="before")
    @classmethod
    def _normalize_path(cls, value: object) -> Path:
        return Path(value) if not isinstance(value, Path) else value


@lru_cache
def get_settings() -> Settings:
    return Settings()