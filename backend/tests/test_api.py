from __future__ import annotations

from base64 import b64encode

from fastapi.testclient import TestClient

from shared.config import Settings, get_settings
from orchestrator.app.routes import agent, clip, intelligence, realtime, session, vision
from orchestrator.app.main import app
from orchestrator.app.services.gemini_client import GeminiClient
from orchestrator.app.services.repository import SessionRepository
from shared.models.schemas import (
    ClipGenerateResponse,
    LiveMessageResponse,
    PriceAnalysis,
    PriceCompareResponse,
    ProductDetection,
    SessionModel,
    StartSessionResponse,
    UiAction,
    UiSuggestResponse,
    UploadScreenshotResponse,
)

from unittest.mock import AsyncMock, patch
import pytest

class MockLiveSession:
    async def __aenter__(self):
        return self
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        pass
    async def send(self, *args, **kwargs):
        pass
    async def receive(self):
        # Yield nothing to avoid infinite loop but simulate a generator
        if False:
            yield None

class MockMultimodalLive:
    def connect(self, *args, **kwargs):
        return MockLiveSession()

class MockModels:
    def __init__(self):
        self.multimodal_live = MockMultimodalLive()

class MockClient:
    def __init__(self):
        self.models = MockModels()

# Mock Gemini Client to avoid hitting real API during tests
class MockGeminiClient:
    def __init__(self, settings):
        self.is_enabled = True
        self.client = MockClient()

    async def generate_text(self, *args, **kwargs):
        # Return valid JSON string for json_mode=True
        return '{"speech": "Hello customer!", "intent": "greeting", "confidence": 0.9, "emotion": "happy", "next_action": "none"}'

    async def generate_from_image(self, *args, **kwargs):
        # Return valid JSON for vision
        return '{"products": [{"name": "Mock Product", "price": 5000, "currency": "NGN", "coords": [10,10,100,100]}], "has_coupon_field": true, "detected_codes": ["TEST"]}'

    async def generate_from_audio(self, *args, **kwargs):
        return "This is a transcribed audio."

@pytest.fixture(autouse=True)
def mock_gemini():
    with patch("orchestrator.app.services.gemini_client.GeminiClient", return_value=MockGeminiClient(None)):
        yield

def _tiny_data_url() -> str:
    png = b64encode(b"\x89PNG\r\n\x1a\n").decode()
    return f"data:image/png;base64,{png}"


@pytest.fixture(autouse=True)
def override_services():
    # Patch the services on the existing app instance
    app.state.gemini_client = MockGeminiClient(None)
    # Re-init services that depend on Client
    from vision_analyzer.service import VisionService
    from orchestrator.app.services.gemini_live import GeminiLiveService
    # We need to access the real classes, which are imported in main.
    # But for simplicity, we can just patch `gemini_client` attribute of services if they hold it.
    if hasattr(app.state, "vision_service"):
        app.state.vision_service.gemini_client = app.state.gemini_client
    if hasattr(app.state, "live_service"):
        app.state.live_service.gemini_client = app.state.gemini_client
    yield

def test_session_lifecycle_and_aliases() -> None:
    with TestClient(app) as client:
        start = client.post("/api/session/start")
        assert start.status_code == 201
        session_id = start.json()["session"]["id"]

        valid = client.get(f"/api/session/{session_id}")
        assert valid.status_code == 200

        invalid = client.get("/api/session/invalid-session-id")
        assert invalid.status_code == 404

        ended = client.delete(f"/api/session/{session_id}")
        assert ended.status_code == 204


def test_vision_price_ui_and_savings_endpoints() -> None:
    with TestClient(app) as client:
        session_id = client.post("/api/session/start").json()["session"]["id"]
        screenshot = _tiny_data_url()

        upload = client.post(
            "/api/upload-screenshot",
            json={"session_id": session_id, "screenshot": screenshot},
        )
        assert upload.status_code == 200

        analyze = client.post(
            "/api/vision/analyze",
            json={"session_id": session_id, "screenshot": screenshot},
        )
        assert analyze.status_code == 200

        bad_image = client.post(
            "/api/vision/analyze",
            json={"session_id": session_id, "screenshot": "data:image/png;base64,###"},
        )
        assert bad_image.status_code == 400

        batch = client.post(
            "/api/vision/analyze-batch",
            json={"session_id": session_id, "screenshots": [screenshot, screenshot]},
        )
        assert batch.status_code == 200
        assert len(batch.json()["results"]) == 2

        products = analyze.json()["products"]
        compare = client.post("/api/price/compare", json={"products": products})
        assert compare.status_code == 200
        assert "savings" in compare.json()

        ui = client.post("/api/ui/suggest", json={"products": products})
        assert ui.status_code == 200
        assert "ui_actions" in ui.json()

        log = client.post(
            "/api/savings/log",
            json={"session_id": session_id, "savings": 12345, "metadata": {"source": "test"}},
        )
        assert log.status_code == 201

        leaderboard = client.get("/api/savings/leaderboard")
        assert leaderboard.status_code == 200

        live = client.post(
            "/api/live-message",
            json={
                "session_id": session_id,
                "transcript": "Should I apply coupon?",
                "products": products,
                "current_suggestion": "Apply discount code",
                "current_cheapest": 1200
            },
        )
        assert live.status_code == 200
        assert live.json()["emotion"] in {"neutral", "hype", "urgent", "reassure", "celebrate"}


def test_clip_generation_and_status() -> None:
    with TestClient(app) as client:
        session_id = client.post("/api/session/start").json()["session"]["id"]

        generate = client.post("/api/clip/generate", json={"session_id": session_id})
        assert generate.status_code == 200
        payload = generate.json()
        assert payload.get("job_id")
        assert isinstance(payload.get("progress"), int)

        status = client.get(f"/api/clip/status/{payload['job_id']}")
        assert status.status_code == 200
        assert status.json()["status"] in {"queued", "processing", "ready", "missing", "failed"}

        # Worker callback path should process the queued job without crashing.
        worker = client.post(
            "/internal/clip/process",
            json={"job_id": payload["job_id"], "session_id": session_id, "caption": "Demo clip", "savings": 123.45},
        )
        assert worker.status_code == 200
        assert worker.json()["status"] in {"ready", "failed", "processing", "queued"}


def test_ui_suggest_viewport_scaling_and_audio_payload() -> None:
    with TestClient(app) as client:
        session_id = client.post("/api/session/start").json()["session"]["id"]
        products = [
            {"name": "Item A", "price": 1000, "currency": "NGN", "coords": [100, 50, 200, 100]},
            {"name": "Item A", "price": 900, "currency": "NGN", "coords": [400, 150, 200, 100]},
        ]

        ui = client.post(
            "/api/ui/suggest",
            json={
                "products": products,
                "source_size": {"width": 1000, "height": 500},
                "viewport_size": {"width": 500, "height": 250},
            },
        )
        assert ui.status_code == 200
        actions = ui.json()["ui_actions"]
        assert len(actions) >= 1
        # The first product coords should be approximately halved.
        x, y, w, h = actions[0]["highlight_coords"]
        assert x in {50, 200}  # depends on which product is chosen as cheapest
        assert y in {25, 75}
        assert w == 100
        assert h == 50

        fake_audio = b64encode(b"fake-webm-audio").decode()
        live = client.post(
            "/api/live-message",
            json={"session_id": session_id, "audio_base64": f"data:audio/webm;base64,{fake_audio}"},
        )
        assert live.status_code == 200
        payload = live.json()
        assert "speech" in payload
        assert payload["emotion"] in {"neutral", "hype", "urgent", "reassure", "celebrate"}


def test_websocket_endpoints() -> None:
    with TestClient(app) as client:
        session_id = client.post("/api/session/start").json()["session"]["id"]

        with client.websocket_connect(f"/ws/{session_id}") as ws:
            first = ws.receive_json()
            assert first["type"] == "CONNECTED"

            ws.send_json({"type":"PING","payload":{}})
            pong = ws.receive_json()
            assert pong["type"] == "PONG"

            ws.send_json({"type":"PAUSE","payload":{}})
            paused = ws.receive_json()
            assert paused["type"] == "PAUSED"

            ws.send_json({"type":"RESUME","payload":{}})
            resumed = ws.receive_json()
            assert resumed["type"] == "RESUMED"

            ws.send_json({"type":"USER_SPEECH","payload":{"text":"Mama abeg"}})
            # Wait for response as it runs in background task
            # In TestClient, background tasks might need manual timing or mocked await
            # But the websocket remains open.
            mama = ws.receive_json()
            assert mama["type"] == "MAMA_SPEAK"
            assert mama["payload"]["emotion"] in {"neutral", "hype", "urgent", "reassure", "celebrate"}

            ws.send_json({"type":"VISION_SCAN","payload":{"screenshot": _tiny_data_url()}})
            savings = ws.receive_json()
            assert savings["type"] == "SAVINGS_UPDATE"
            highlight = ws.receive_json()
            assert highlight["type"] == "HIGHLIGHT"
