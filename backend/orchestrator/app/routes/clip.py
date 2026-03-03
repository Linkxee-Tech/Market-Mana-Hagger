from fastapi import APIRouter, Depends, Header, HTTPException, status

from shared.config import Settings, get_settings
from shared.models.schemas import (
    ClipGenerateRequest,
    ClipGenerateResponse,
    ClipProcessRequest,
    ClipStatusResponse,
)
from clip_renderer.service import ClipRendererService
from orchestrator.app.services.realtime_hub import RealtimeHub
from orchestrator.app.services.repository import SessionRepository
from shared.utils.auth import AuthenticatedUser, get_current_user
from shared.utils.dependencies import enforce_rate_limit, get_clip_service, get_realtime_hub, get_repository
from shared.utils.session_guard import require_owned_active_session

router = APIRouter(tags=["clip"])


@router.post(
    "/api/clip/generate",
    response_model=ClipGenerateResponse,
    dependencies=[Depends(enforce_rate_limit)],
)
async def generate_clip(
    payload: ClipGenerateRequest,
    user: AuthenticatedUser = Depends(get_current_user),
    settings: Settings = Depends(get_settings),
    repository: SessionRepository = Depends(get_repository),
    clip_service: ClipRendererService = Depends(get_clip_service),
    realtime_hub: RealtimeHub = Depends(get_realtime_hub),
) -> ClipGenerateResponse:
    session = require_owned_active_session(
        repository=repository,
        settings=settings,
        session_id=payload.session_id,
        user_id=user.user_id,
    )

    clip_result = await clip_service.request_clip(
        payload.session_id,
        caption=payload.caption or "Market-Mama Haggler",
        savings=payload.savings if payload.savings is not None else session.total_savings,
    )

    repository.record_transaction(
        session_id=payload.session_id,
        user_id=user.user_id,
        transaction_type="clip_generation",
        payload={
            "status": clip_result.status,
            "clip_url": clip_result.clip_url,
            "job_id": clip_result.job_id,
            "progress": clip_result.progress,
        },
    )

    await realtime_hub.broadcast(
        session_id=payload.session_id,
        event="clip.status",
        payload={
            "status": clip_result.status,
            "clip_url": clip_result.clip_url,
            "job_id": clip_result.job_id,
            "progress": clip_result.progress,
            "error": clip_result.error,
        },
    )

    return ClipGenerateResponse(
        status=clip_result.status,
        clip_url=clip_result.clip_url,
        job_id=clip_result.job_id,
        progress=clip_result.progress,
        error=clip_result.error,
    )


@router.get(
    "/api/clip/status/{job_id}",
    response_model=ClipStatusResponse,
    dependencies=[Depends(enforce_rate_limit)],
)
async def clip_status(
    job_id: str,
    clip_service: ClipRendererService = Depends(get_clip_service),
) -> ClipStatusResponse:
    status_result = await clip_service.get_status(job_id)
    return ClipStatusResponse(
        status=status_result.status,
        clip_url=status_result.clip_url,
        job_id=status_result.job_id,
        progress=status_result.progress,
        error=status_result.error,
    )


@router.post("/internal/clip/process", response_model=ClipStatusResponse, include_in_schema=False)
async def process_clip_job(
    payload: ClipProcessRequest,
    settings: Settings = Depends(get_settings),
    clip_service: ClipRendererService = Depends(get_clip_service),
    worker_token: str | None = Header(default=None, alias="X-Clip-Worker-Token"),
) -> ClipStatusResponse:
    expected = settings.clip_worker_token
    if expected and worker_token != expected:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid clip worker token")

    result = await clip_service.process_job(
        job_id=payload.job_id,
        session_id=payload.session_id,
        caption=payload.caption,
        savings=payload.savings,
    )
    return ClipStatusResponse(
        status=result.status,
        clip_url=result.clip_url,
        job_id=result.job_id,
        progress=result.progress,
        error=result.error,
    )
