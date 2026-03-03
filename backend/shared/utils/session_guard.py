from __future__ import annotations

from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, status

from shared.config import Settings
from orchestrator.app.services.repository import SessionRepository


def require_owned_session(
    repository: SessionRepository,
    session_id: str,
    user_id: str,
) -> SessionModel:
    session = repository.get_session(session_id)
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

    if session.user_id != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Session access denied")

    return session


def require_owned_active_session(
    repository: SessionRepository,
    settings: Settings,
    session_id: str,
    user_id: str
) -> SessionModel:
    session = require_owned_session(repository=repository, session_id=session_id, user_id=user_id)

    if session.status != "active":
        raise HTTPException(status_code=status.HTTP_410_GONE, detail="Session is not active")

    ttl = timedelta(minutes=settings.session_ttl_minutes)
    if datetime.now(timezone.utc) - session.created_at > ttl:
        raise HTTPException(status_code=status.HTTP_410_GONE, detail="Session expired")

    return session
