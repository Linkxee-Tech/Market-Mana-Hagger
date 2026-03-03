
from fastapi import APIRouter, Depends

from shared.config import Settings, get_settings
from shared.models.schemas import (
    LeaderboardEntry,
    LeaderboardResponse,
    PriceCompareRequest,
    PriceCompareResponse,
    ProductDetection,
    SavingsLogRequest,
    SavingsLogResponse,
    UiAction,
    UiSuggestRequest,
    UiSuggestResponse,
)
from price_intelligence.service import PriceEngine
from orchestrator.app.services.realtime_hub import RealtimeHub
from orchestrator.app.services.repository import SessionRepository
from ui_action_engine.service import UiEngine
from shared.utils.auth import AuthenticatedUser, get_current_user
from shared.utils.dependencies import (
    enforce_rate_limit,
    get_price_engine,
    get_realtime_hub,
    get_repository,
    get_ui_engine,
)
from shared.utils.session_guard import require_owned_active_session

router = APIRouter(tags=["intelligence"], dependencies=[Depends(enforce_rate_limit)])


@router.post("/api/price/compare", response_model=PriceCompareResponse)
async def compare_prices(
    payload: PriceCompareRequest,
    price_engine: PriceEngine = Depends(get_price_engine),
) -> PriceCompareResponse:
    analysis = await price_engine.analyze(payload.products)
    return PriceCompareResponse(
        cheapest_option=analysis.cheapest_option,
        savings=analysis.savings,
        suggestion=analysis.suggestion,
    )


@router.post("/api/ui/suggest", response_model=UiSuggestResponse)
async def ui_suggest(
    payload: UiSuggestRequest,
    price_engine: PriceEngine = Depends(get_price_engine),
    ui_engine: UiEngine = Depends(get_ui_engine),
) -> UiSuggestResponse:
    analysis = payload.analysis or await price_engine.analyze(payload.products)
    source_size = None
    viewport_size = None
    if payload.source_size:
        source_size = (payload.source_size.width, payload.source_size.height)
    if payload.viewport_size:
        viewport_size = (payload.viewport_size.width, payload.viewport_size.height)

    actions = ui_engine.suggest_actions(
        payload.products,
        analysis,
        source_size=source_size,
        viewport_size=viewport_size,
    )
    return UiSuggestResponse(ui_actions=actions)


@router.post("/api/savings/log", response_model=SavingsLogResponse, status_code=201)
async def savings_log(
    payload: SavingsLogRequest,
    user: AuthenticatedUser = Depends(get_current_user),
    settings: Settings = Depends(get_settings),
    repository: SessionRepository = Depends(get_repository),
    realtime_hub: RealtimeHub = Depends(get_realtime_hub),
) -> SavingsLogResponse:
    session = require_owned_active_session(
        repository=repository,
        settings=settings,
        session_id=payload.session_id,
        user_id=user.user_id,
    )

    repository.update_session_savings(session.id, payload.savings)
    repository.log_savings(
        session_id=session.id,
        user_id=user.user_id,
        savings=payload.savings,
        metadata=payload.metadata or {},
    )

    await realtime_hub.broadcast(
        session_id=session.id,
        event="savings.updated",
        payload={
            "session_id": session.id,
            "total_savings": max(session.total_savings, payload.savings),
            "suggestion": "Savings logged",
        },
    )

    return SavingsLogResponse(status="logged")


@router.get("/api/savings/leaderboard", response_model=LeaderboardResponse)
async def savings_leaderboard(
    limit: int = 10,
    window: str = "all",
    repository: SessionRepository = Depends(get_repository),
) -> LeaderboardResponse:
    entries = [LeaderboardEntry(**item) for item in repository.get_top_savers(limit=limit, window=window)]
    return LeaderboardResponse(entries=entries)
