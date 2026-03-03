import json
import asyncio
import base64

from typing import Any, Optional
from contextlib import asynccontextmanager

from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect
from starlette.websockets import WebSocket, WebSocketDisconnect
from starlette.websockets import WebSocketState

from shared.models.schemas import UnifiedWsIncoming, LiveMessageRequest

from orchestrator.app.services.realtime_hub import RealtimeHub
from orchestrator.app.services.repository import SessionRepository
from price_intelligence.service import NegotiationEngine
from vision_analyzer.service import VisionService
from ui_action_engine.service import UiEngine
from shared.utils.auth_ws import get_ws_user
from shared.utils.dependencies import (
    get_live_service,
    get_price_engine,
    get_realtime_hub,
    get_repository,
    get_ui_engine,
    get_vision_service,
)
from shared.utils.json_tools import extract_json_payload
from shared.utils.images import decode_data_url

router = APIRouter(tags=["realtime"])


async def _run_vision_scan(
    *,
    session_id: str,
    screenshot: str,
    websocket: WebSocket,
    repository: SessionRepository,
    vision_service: VisionService,
    price_engine: NegotiationEngine,
    ui_engine: UiEngine,
) -> None:
    try:
        image_bytes, mime_type = decode_data_url(screenshot)
        vision = await vision_service.analyze(image_bytes=image_bytes, mime_type=mime_type)
        analysis = await price_engine.analyze(vision.products)
        actions = ui_engine.suggest_actions(vision.products, analysis)
        repository.update_session_savings(session_id, analysis.savings)
        
        session = repository.get_session(session_id)

        await websocket.send_json(
            {
                "type": "SAVINGS_UPDATE",
                "payload": {
                    "totalSavings": session.total_savings if session else analysis.savings,
                    "cheapest": analysis.cheapest_option,
                    "suggestion": analysis.suggestion,
                    "mood": analysis.metadata.get("mood", "neutral"),
                },
            }
        )

        await websocket.send_json(
            {
                "type": "HIGHLIGHT",
                "payload": {
                    "actions": [action.model_dump() for action in actions],
                },
            }
        )
    except Exception as exc:
        await websocket.send_json({"type": "ERROR", "payload": {"message": f"Vision error: {str(exc)} "}})


@router.websocket("/ws/{session_id}")
async def unified_ws(
    websocket: WebSocket,
    session_id: str,
    persona: str = "ibadan",
    user=Depends(get_ws_user),
    repository: SessionRepository = Depends(get_repository),
    live_service: Any = Depends(get_live_service),
    vision_service: VisionService = Depends(get_vision_service),
    price_engine: NegotiationEngine = Depends(get_price_engine),
    ui_engine: UiEngine = Depends(get_ui_engine),
) -> None:
    session_model = repository.get_session(session_id)
    if not session_model:
        await websocket.close(code=4404)
        return

    await websocket.accept()
    
    @asynccontextmanager
    async def null_context():
        yield None

    # Initialize Gemini Live Multimodal Session using async context manager
    gemini_live_cm = live_service.connect_session(persona_id=persona)
    if not gemini_live_cm:
        gemini_live_cm = null_context()

    async with gemini_live_cm as live_session:
        await websocket.send_json(
            {
                "type": "CONNECTED",
                "payload": {
                    "sessionId": session_id,
                    "status": session_model.status,
                    "totalSavings": session_model.total_savings,
                    "persona": persona
                },
            }
        )

        async def receive_from_gemini():
            """Relays audio from Gemini back to the user."""
            try:
                async for audio_chunk in live_session.receive():
                    if audio_chunk.server_content and audio_chunk.server_content.model_turn:
                        for part in audio_chunk.server_content.model_turn.parts:
                            if part.inline_data:
                                # Send binary audio chunk or base64
                                b64_audio = base64.b64encode(part.inline_data.data).decode("utf-8")
                                await websocket.send_json({
                                    "type": "MAMA_AUDIO",
                                    "payload": {"audio": b64_audio}
                                })
            except Exception as e:
                print(f"Gemini receive error: {e}")

        # Run Gemini relay in background
        gemini_task = None
        if live_session:
            gemini_task = asyncio.create_task(receive_from_gemini())

        try:
            while True:
                raw_message = await websocket.receive_text()
                payload = json.loads(raw_message)
                msg_type = str(payload.get("type") or "").upper()

                if msg_type == "PING":
                    await websocket.send_json({"type": "PONG", "payload": {"sessionId": session_id}})
                    continue

                if msg_type == "USER_AUDIO":
                    # Forward binary audio to Gemini
                    audio_b64 = payload.get("payload", {}).get("audio")
                    if audio_b64 and live_session:
                        audio_bytes = base64.b64decode(audio_b64)
                        await live_session.send(input=audio_bytes, end_of_turn=False)
                    continue

                if (msg_type == "USER_STOP") or (msg_type == "INTERRUPT"):
                    # Signal end of turn or explicit interruption
                    if live_session:
                        # For Gemini Live, sending empty input with end_of_turn=True typically interrupts
                        await live_session.send(input=b"", end_of_turn=True)
                    continue

                if msg_type == "VISION_SCAN":
                    screenshot = str((payload.get("payload") or {}).get("screenshot") or "")
                    asyncio.create_task(
                        _run_vision_scan(
                            session_id=session_id,
                            screenshot=screenshot,
                            websocket=websocket,
                            repository=repository,
                            vision_service=vision_service,
                            price_engine=price_engine,
                            ui_engine=ui_engine,
                        )
                    )
                    continue
                
        except WebSocketDisconnect:
            pass
        except Exception as exc:
            try:
                import traceback
                traceback.print_exc()
                await websocket.send_json({"type": "ERROR", "payload": {"message": str(exc)}})
            except:
                pass
        finally:
            if gemini_task:
                gemini_task.cancel()

