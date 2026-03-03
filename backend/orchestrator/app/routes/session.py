from fastapi import APIRouter, Depends, HTTPException, status, Response

from shared.config import Settings, get_settings
from shared.models.schemas import (
    SessionModel,
    StartSessionRequest,
    StartSessionResponse,
    EndSessionRequest,
    LeaderboardEntry,
    LeaderboardResponse,
)
from orchestrator.app.services.realtime_hub import RealtimeHub
from orchestrator.app.services.repository import SessionRepository
from shared.utils.auth import AuthenticatedUser, get_current_user
from shared.utils.dependencies import enforce_rate_limit, get_repository, get_realtime_hub
from shared.utils.session_guard import require_owned_session, require_owned_active_session

router = APIRouter(tags=["session"], dependencies=[Depends(enforce_rate_limit)])


@router.post("/api/session/start", response_model=StartSessionResponse, status_code=201)
async def start_session(
    user: AuthenticatedUser = Depends(get_current_user),
    repository: SessionRepository = Depends(get_repository)
) -> StartSessionResponse:
    session = repository.create_session(user_id=user.user_id)
    rtc_config = {
        "ice_servers": [
            {"urls": ["stun:stun.l.google.com:19302"]}
        ]
    }
    return StartSessionResponse(session=session, rtc_config=rtc_config)


@router.get("/api/session/{session_id}", response_model=SessionModel)
async def get_session(
    session_id: str,
    user: AuthenticatedUser = Depends(get_current_user),
    settings: Settings = Depends(get_settings),
    repository: SessionRepository = Depends(get_repository)
) -> SessionModel:
    _ = settings  # keep dependency for potential policy controls
    session = require_owned_session(
        repository=repository,
        session_id=session_id,
        user_id=user.user_id
    )
    return session


@router.post("/api/session/{session_id}/end", response_model=SessionModel)
async def end_session(
    session_id: str,
    user: AuthenticatedUser = Depends(get_current_user),
    settings: Settings = Depends(get_settings),
    repository: SessionRepository = Depends(get_repository),
    realtime_hub: RealtimeHub = Depends(get_realtime_hub),
) -> SessionModel:
    _ = settings
    session = require_owned_session(
        repository=repository,
        session_id=session_id,
        user_id=user.user_id
    )

    ended = repository.end_session(session.id)
    if not ended:
        return session

    await realtime_hub.broadcast(
        session_id=session.id,
        event="session.ended",
        payload={"session_id": session.id, "status": "ended"},
    )

    return ended


@router.delete("/api/session/{session_id}", status_code=204)
async def delete_session(
    session_id: str,
    user: AuthenticatedUser = Depends(get_current_user),
    settings: Settings = Depends(get_settings),
    repository: SessionRepository = Depends(get_repository),
    realtime_hub: RealtimeHub = Depends(get_realtime_hub),
) -> Response:
    _ = settings
    session = require_owned_session(
        repository=repository,
        session_id=session_id,
        user_id=user.user_id,
    )
    repository.end_session(session.id)

    await realtime_hub.broadcast(
        session_id=session.id,
        event="session.ended",
        payload={"session_id": session.id, "status": "ended"},
    )

    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/api/leaderboard", response_model=LeaderboardResponse)
async def get_leaderboard(
    limit: int = 10,
    window: str = "all",
    repository: SessionRepository = Depends(get_repository),
) -> LeaderboardResponse:
    entries = [LeaderboardEntry(**item) for item in repository.get_top_savers(limit=limit, window=window)]
    return LeaderboardResponse(entries=entries)

