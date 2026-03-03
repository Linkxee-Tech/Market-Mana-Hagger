from fastapi import WebSocket, status, Query
from typing import Optional

async def get_ws_user(
    websocket: WebSocket,
    token: Optional[str] = Query(None),
):
    """
    Validate WebSocket connection token.
    For hackathon/dev, we allow anonymous connections if configured,
    but in production this would verify a Firebase ID token.
    """
    # In a real app, verify `token` here.
    # For now, we just enforce that a connection attempt happens.
    if not token:
        # We could reject here, but for "anonymous" support we might allow it.
        # await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        pass
    
    return {"user_id": "anonymous", "authenticated": bool(token)}
