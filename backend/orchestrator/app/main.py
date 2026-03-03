from contextlib import asynccontextmanager
import time

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.requests import Request
import sys
import os

# Fix imports for modular monolith structure
# Add service directories to sys.path so 'from vision_analyzer.service import ...' works
current_dir = os.path.dirname(os.path.abspath(__file__))
# orchestrator/app -> orchestrator -> backend
backend_path = os.path.abspath(os.path.join(current_dir, "../.."))

for service_dir in ["vision-analyzer", "price-intelligence", "ui-action-engine", "clip-renderer"]:
    path = os.path.join(backend_path, service_dir)
    if path not in sys.path:
        sys.path.insert(0, path)
    # Also add the inner package directory if it exists
    pkg_name = service_dir.replace("-", "_")
    pkg_path = os.path.join(path, pkg_name)
    if os.path.exists(pkg_path) and path not in sys.path:
        sys.path.insert(0, path)


from shared.config import get_settings
from orchestrator.app.routes.agent import router as agent_router
from orchestrator.app.routes.clip import router as clip_router
from orchestrator.app.routes.intelligence import router as intelligence_router
from orchestrator.app.routes.realtime import router as realtime_router
from orchestrator.app.routes.session import router as session_router
from orchestrator.app.routes.vision import router as vision_router


from shared.utils.rate_limit import InMemoryRateLimiter, RedisRateLimiter


@asynccontextmanager
async def lifespan(app: FastAPI):
    from shared.utils.logging import setup_logging
    setup_logging()
    
    from clip_renderer.service import ClipRendererService
    from orchestrator.app.services.gemini_client import GeminiClient
    from orchestrator.app.services.gemini_live import GeminiLiveService
    from price_intelligence.service import PriceEngine
    from orchestrator.app.services.realtime_hub import RealtimeHub
    from orchestrator.app.services.repository import SessionRepository
    from ui_action_engine.service import UiEngine
    from vision_analyzer.service import VisionService

    settings = get_settings()

    repository = SessionRepository(settings)
    gemini_client = GeminiClient(settings)

    app.state.repository = repository
    app.state.price_engine = PriceEngine(settings, gemini_client)
    app.state.ui_engine = UiEngine()
    app.state.vision_service = VisionService(settings, gemini_client)
    app.state.live_service = GeminiLiveService(settings, gemini_client)
    app.state.clip_service = ClipRendererService(settings, repository)
    app.state.realtime_hub = RealtimeHub()

    if settings.redis_url:
        try:
            app.state.rate_limiter = RedisRateLimiter(
                redis_url=settings.redis_url,
                requests_per_minute=settings.requests_per_minute_default,
                prefix=settings.redis_prefix,
            )
        except Exception:
            app.state.rate_limiter = InMemoryRateLimiter(settings.requests_per_minute_default)
    else:
        app.state.rate_limiter = InMemoryRateLimiter(settings.requests_per_minute_default)

    yield


settings = get_settings()
app = FastAPI(title="Market-Mama Orchestrator", version="1.2.0", lifespan=lifespan)

allowed_origins = settings.allowed_origins_list
# Use permissive CORS for all environments to ensure the frontend can connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def request_timing_middleware(request: Request, call_next):
    start = time.perf_counter()
    response = await call_next(request)
    elapsed = time.perf_counter() - start
    response.headers["X-Process-Time"] = f"{elapsed:.4f}"
    return response


@app.get("/healthz")
async def health() -> dict[str, str]:
    return {"status": "ok", "service": "mama-orchestrator"}


app.include_router(session_router)
app.include_router(vision_router)
app.include_router(intelligence_router)
app.include_router(agent_router)
app.include_router(clip_router)
app.include_router(realtime_router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8080)
