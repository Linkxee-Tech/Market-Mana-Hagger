from __future__ import annotations

import asyncio
from collections import defaultdict
from typing import Any

from fastapi import WebSocket


class RealtimeHub:
    def __init__(self) -> None:
        self._connections: dict[str, set[WebSocket]] = defaultdict(set)
        self._lock = asyncio.Lock()

    async def connect(self, session_id: str, websocket: WebSocket) -> None:
        await websocket.accept()
        async with self._lock:
            self._connections[session_id].add(websocket)

    async def disconnect(self, session_id: str, websocket: WebSocket) -> None:
        async with self._lock:
            if session_id in self._connections and websocket in self._connections[session_id]:
                self._connections[session_id].remove(websocket)
            if session_id in self._connections and not self._connections[session_id]:
                self._connections.pop(session_id, None)

    async def broadcast(self, session_id: str, event: str, payload: dict[str, Any]) -> None:
        message = {"event": event, "payload": payload}

        async with self._lock:
            sockets = list(self._connections.get(session_id, set()))

        for socket in sockets:
            try:
                await socket.send_json(message)
            except Exception:
                await self.disconnect(session_id, socket)
