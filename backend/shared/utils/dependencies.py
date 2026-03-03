from __future__ import annotations

from functools import lru_cache
from typing import AsyncGenerator

from fastapi import Depends, HTTPException, Request, status
from starlette.requests import HTTPConnection

from shared.config import Settings, get_settings
from orchestrator.app.services.gemini_client import GeminiClient
from orchestrator.app.services.realtime_hub import RealtimeHub
from orchestrator.app.services.repository import SessionRepository
from shared.utils.rate_limit import RedisRateLimiter, InMemoryRateLimiter

from shared.utils.auth import AuthenticatedUser, get_current_user


def get_repository(connection: HTTPConnection) -> SessionRepository:
    from orchestrator.app.services.repository import SessionRepository
    return connection.app.state.repository


def get_vision_service(connection: HTTPConnection) -> VisionService:
    from vision_analyzer.service import VisionService
    return connection.app.state.vision_service


def get_price_engine(connection: HTTPConnection) -> PriceEngine:
    from price_intelligence.service import PriceEngine
    return connection.app.state.price_engine


def get_ui_engine(connection: HTTPConnection) -> UiEngine:
    from ui_action_engine.service import UiEngine
    return connection.app.state.ui_engine


def get_live_service(connection: HTTPConnection) -> GeminiLiveService:
    from orchestrator.app.services.gemini_live import GeminiLiveService
    return connection.app.state.live_service


def get_clip_service(connection: HTTPConnection) -> ClipRendererService:
    from clip_renderer.service import ClipRendererService
    return connection.app.state.clip_service


def get_realtime_hub(connection: HTTPConnection) -> RealtimeHub:
    return connection.app.state.realtime_hub


def _endpoint_limit(path: str, settings: Settings) -> int:
    vision_paths = (
        "/api/upload-screenshot",
        "/api/vision/analyze",
        "/api/vision/analyze-batch",
    )
    if any(path.startswith(prefix) for prefix in vision_paths):
        return settings.requests_per_minute_vision

    if path.startswith("/ws"):
        return settings.requests_per_minute_default

    return settings.requests_per_minute_default


def enforce_rate_limit(
    connection: HTTPConnection,
    user: AuthenticatedUser = Depends(get_current_user),
    settings: Settings = Depends(get_settings),
) -> None:
    path = connection.url.path
    key = f"{user.user_id}:{path}"
    limit = _endpoint_limit(path, settings)
    connection.app.state.rate_limiter.hit(key, limit=limit)
