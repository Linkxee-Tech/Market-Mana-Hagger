from typing import Any
from fastapi import APIRouter, Depends
from shared.config import Settings, get_settings
from shared.models.schemas import LiveMessageResponse, LiveMessageRequest
from orchestrator.app.services.realtime_hub import RealtimeHub
from orchestrator.app.services.repository import SessionRepository
from shared.utils.auth import AuthenticatedUser, get_current_user
from shared.utils.dependencies import enforce_rate_limit, get_live_service, get_repository, get_realtime_hub
from shared.utils.session_guard import require_owned_active_session

router = APIRouter(tags=["agent"], dependencies=[Depends(enforce_rate_limit)])


@router.post("/api/live-message", response_model=LiveMessageResponse)
async def live_message(
    payload: LiveMessageRequest,
    user: AuthenticatedUser = Depends(get_current_user),
    settings: Settings = Depends(get_settings),
    repository: SessionRepository = Depends(get_repository),
    live_service: Any = Depends(get_live_service),
    realtime_hub: RealtimeHub = Depends(get_realtime_hub),
) -> LiveMessageResponse:
    session = require_owned_active_session(
        repository=repository,
        settings=settings,
        session_id=payload.session_id,
        user_id=user.user_id
    )

    transcript = (payload.transcript or "").strip()
    if not transcript and payload.audio_base64:
        transcript = await live_service.transcribe_audio(payload.audio_base64)

    response = await live_service.respond(
        transcript=transcript,
        context={
            "total_savings": session.total_savings,
            "products": [p.model_dump() for p in (payload.products or [])],
            "current_suggestion": payload.current_suggestion,
            "current_cheapest": payload.current_cheapest,
        },
    )

    repository.record_transaction(
        session_id=payload.session_id,
        user_id=user.user_id,
        transaction_type="live_message",
        payload={
            "transcript": transcript,
            "intent": response.intent,
            "confidence": response.confidence,
            "emotion": response.emotion,
        },
    )

    await realtime_hub.broadcast(
        session_id=payload.session_id,
        event="agent.reply",
        payload={
            "speech": response.speech,
            "intent": response.intent,
            "confidence": response.confidence,
            "emotion": response.emotion,
        },
    )

    return response
