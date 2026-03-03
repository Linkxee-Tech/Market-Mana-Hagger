from functools import lru_cache
from typing import List

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_env: str = Field(default="development", alias="APP_ENV")
    port: int = Field(default=8080, alias="PORT")
    allowed_origins: str = Field(default="http://localhost:5173", alias="ALLOWED_ORIGINS")

    allow_dev_auth_bypass: bool = Field(default=True, alias="ALLOW_DEV_AUTH_BYPASS")
    requests_per_minute_default: int = Field(default=100, alias="REQUESTS_PER_MINUTE_DEFAULT")
    requests_per_minute_vision: int = Field(default=30, alias="REQUESTS_PER_MINUTE_VISION")
    requests_per_minute: int = Field(default=60, alias="REQUESTS_PER_MINUTE")
    session_ttl_minutes: int = Field(default=60, alias="SESSION_TTL_MINUTES")
    vision_cache_ttl_seconds: int = Field(default=30, alias="VISION_CACHE_TTL_SECONDS")

    gemini_api_key: str | None = Field(default=None, alias="GEMINI_API_KEY")
    gemini_text_model: str = Field(default="gemini-2.0-flash", alias="GEMINI_TEXT_MODEL")
    gemini_vision_model: str = Field(default="gemini-2.0-flash", alias="GEMINI_VISION_MODEL")
    gemini_live_model: str | None = Field(default="gemini-2.0-flash-exp", alias="GEMINI_LIVE_MODEL")

    firestore_project_id: str | None = Field(default=None, alias="FIRESTORE_PROJECT_ID")
    firebase_project_id: str | None = Field(default=None, alias="FIREBASE_PROJECT_ID")

    redis_url: str | None = Field(default=None, alias="REDIS_URL")
    redis_prefix: str = Field(default="mama", alias="REDIS_PREFIX")

    gcs_bucket: str | None = Field(default=None, alias="GCS_BUCKET")
    clip_base_url: str | None = Field(default=None, alias="CLIP_BASE_URL")
    ffmpeg_binary: str = Field(default="ffmpeg", alias="FFMPEG_BINARY")
    clip_duration_seconds: int = Field(default=30, alias="CLIP_DURATION_SECONDS")
    clip_width: int = Field(default=1280, alias="CLIP_WIDTH")
    clip_height: int = Field(default=720, alias="CLIP_HEIGHT")

    clip_worker_url: str | None = Field(default=None, alias="CLIP_WORKER_URL")
    clip_worker_token: str | None = Field(default=None, alias="CLIP_WORKER_TOKEN")
    clip_tasks_project_id: str | None = Field(default=None, alias="CLIP_TASKS_PROJECT_ID")
    clip_tasks_queue: str = Field(default="mama-clip-generation", alias="CLIP_TASKS_QUEUE")
    clip_tasks_location: str = Field(default="us-central1", alias="CLIP_TASKS_LOCATION")
    clip_tasks_service_account: str | None = Field(default=None, alias="CLIP_TASKS_SERVICE_ACCOUNT")

    ws_base_url: str | None = Field(default=None, alias="WS_BASE_URL")
    require_secure_ws: bool = Field(default=False, alias="REQUIRE_SECURE_WS")

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", case_sensitive=False)

    @property
    def allowed_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.allowed_origins.split(",") if origin.strip()]

    @property
    def is_production(self) -> bool:
        return self.app_env.lower() in {"production", "prod"}


@lru_cache
def get_settings() -> Settings:
    return Settings()
