
from fastapi import APIRouter, Depends, HTTPException, status

from shared.config import Settings, get_settings
from shared.models.schemas import (
    UploadScreenshotRequest,
    UploadScreenshotResponse,
    VisionAnalyzeBatchRequest,
    VisionAnalyzeBatchResponse,
)
from price_intelligence.service import PriceEngine
from orchestrator.app.services.realtime_hub import RealtimeHub
from orchestrator.app.services.repository import SessionRepository
from ui_action_engine.service import UiEngine
from vision_analyzer.service import VisionService
from shared.utils.auth import AuthenticatedUser, get_current_user
from shared.utils.dependencies import (
    enforce_rate_limit,
    get_price_engine,
    get_realtime_hub,
    get_repository,
    get_ui_engine,
    get_vision_service,
)
from shared.utils.images import decode_data_url
from shared.utils.session_guard import require_owned_active_session

router = APIRouter(tags=["vision"], dependencies=[Depends(enforce_rate_limit)])


async def _analyze_single(
    *,
    payload: UploadScreenshotRequest,
    user: AuthenticatedUser,
    settings: Settings,
    repository: SessionRepository,
    vision_service: VisionService,
    price_engine: PriceEngine,
    ui_engine: UiEngine,
    realtime_hub: RealtimeHub,
) -> UploadScreenshotResponse:
    require_owned_active_session(
        repository=repository,
        settings=settings,
        session_id=payload.session_id,
        user_id=user.user_id,
    )

    try:
        image_bytes, mime_type = decode_data_url(payload.screenshot)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    vision_analysis = await vision_service.analyze(image_bytes=image_bytes, mime_type=mime_type)

    analysis = price_engine.analyze(vision_analysis.products)
    ui_actions = ui_engine.suggest_actions(vision_analysis.products, analysis)

    updated = repository.update_session_savings(payload.session_id, analysis.savings)
    repository.log_savings(
        session_id=payload.session_id,
        user_id=user.user_id,
        savings=analysis.savings,
        metadata={
            "products_detected": len(vision_analysis.products),
            "coupon_detected": vision_analysis.has_coupon_field,
            "codes": vision_analysis.detected_codes,
        },
    )

    await realtime_hub.broadcast(
        session_id=payload.session_id,
        event="savings.updated",
        payload={
            "session_id": payload.session_id,
            "total_savings": updated.total_savings if updated else analysis.savings,
            "suggestion": analysis.suggestion,
        },
    )

    return UploadScreenshotResponse(
        products=vision_analysis.products,
        analysis=analysis,
        ui_actions=ui_actions,
    )


@router.post("/api/upload-screenshot", response_model=UploadScreenshotResponse)
async def upload_screenshot(
    payload: UploadScreenshotRequest,
    user: AuthenticatedUser = Depends(get_current_user),
    settings: Settings = Depends(get_settings),
    repository: SessionRepository = Depends(get_repository),
    vision_service: VisionService = Depends(get_vision_service),
    price_engine: PriceEngine = Depends(get_price_engine),
    ui_engine: UiEngine = Depends(get_ui_engine),
    realtime_hub: RealtimeHub = Depends(get_realtime_hub),
) -> UploadScreenshotResponse:
    return await _analyze_single(
        payload=payload,
        user=user,
        settings=settings,
        repository=repository,
        vision_service=vision_service,
        price_engine=price_engine,
        ui_engine=ui_engine,
        realtime_hub=realtime_hub,
    )


@router.post("/api/vision/analyze", response_model=UploadScreenshotResponse)
async def vision_analyze(
    payload: UploadScreenshotRequest,
    user: AuthenticatedUser = Depends(get_current_user),
    settings: Settings = Depends(get_settings),
    repository: SessionRepository = Depends(get_repository),
    vision_service: VisionService = Depends(get_vision_service),
    price_engine: PriceEngine = Depends(get_price_engine),
    ui_engine: UiEngine = Depends(get_ui_engine),
    realtime_hub: RealtimeHub = Depends(get_realtime_hub),
) -> UploadScreenshotResponse:
    return await _analyze_single(
        payload=payload,
        user=user,
        settings=settings,
        repository=repository,
        vision_service=vision_service,
        price_engine=price_engine,
        ui_engine=ui_engine,
        realtime_hub=realtime_hub,
    )


@router.post("/api/vision/analyze-batch", response_model=VisionAnalyzeBatchResponse)
async def vision_analyze_batch(
    payload: VisionAnalyzeBatchRequest,
    user: AuthenticatedUser = Depends(get_current_user),
    settings: Settings = Depends(get_settings),
    repository: SessionRepository = Depends(get_repository),
    vision_service: VisionService = Depends(get_vision_service),
    price_engine: PriceEngine = Depends(get_price_engine),
    ui_engine: UiEngine = Depends(get_ui_engine),
    realtime_hub: RealtimeHub = Depends(get_realtime_hub),
) -> VisionAnalyzeBatchResponse:
    if len(payload.screenshots) == 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No screenshots provided")

    if len(payload.screenshots) > 10:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Batch size cannot exceed 10 screenshots")

    results: list[UploadScreenshotResponse] = []
    for screenshot in payload.screenshots:
        single = UploadScreenshotRequest(session_id=payload.session_id, screenshot=screenshot)
        result = await _analyze_single(
            payload=single,
            user=user,
            settings=settings,
            repository=repository,
            vision_service=vision_service,
            price_engine=price_engine,
            ui_engine=ui_engine,
            realtime_hub=realtime_hub,
        )
        results.append(result)

    return VisionAnalyzeBatchResponse(results=results)
