from __future__ import annotations

import os
from dataclasses import dataclass

from fastapi import Depends, HTTPException, Request, status

from shared.config import Settings, get_settings


@dataclass
class AuthenticatedUser:
    user_id: str
    provider: str


def _extract_bearer_token(request: Request) -> str | None:
    header = request.headers.get("Authorization")
    if not header:
        return None

    parts = header.split(" ", 1)
    if len(parts) != 2 or parts[0].lower() != "bearer":
        return None

    return parts[1].strip() or None


def _verify_with_firebase(token: str, settings: Settings) -> AuthenticatedUser:
    try:
        import firebase_admin
        from firebase_admin import auth as firebase_auth
        from firebase_admin import credentials
    except Exception as exc:
        raise RuntimeError("firebase-admin is not installed") from exc

    if not firebase_admin._apps:
        cred = None
        credentials_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
        if credentials_path and os.path.exists(credentials_path):
            cred = credentials.Certificate(credentials_path)

        options: dict[str, str] = {}
        if settings.firebase_project_id:
            options["projectId"] = settings.firebase_project_id

        if cred:
            firebase_admin.initialize_app(cred, options=options or None)
        else:
            firebase_admin.initialize_app(options=options or None)

    decoded = firebase_auth.verify_id_token(token)
    user_id = str(decoded.get("uid") or "")
    if not user_id:
        raise ValueError("Token missing uid claim")

    return AuthenticatedUser(user_id=user_id, provider="firebase")


def get_current_user(request: Request, settings: Settings = Depends(get_settings)) -> AuthenticatedUser:
    token = _extract_bearer_token(request)

    if not token:
        if settings.allow_dev_auth_bypass:
            return AuthenticatedUser(user_id="dev-user", provider="bypass")

        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing bearer token")

    try:
        return _verify_with_firebase(token, settings)
    except Exception:
        if settings.allow_dev_auth_bypass:
            safe_id = f"dev-{token[:8]}"
            return AuthenticatedUser(user_id=safe_id, provider="bypass")

        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid auth token")
