from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


ActionType = Literal["click", "scroll", "input", "none"]
EmotionTag = Literal["neutral", "hype", "urgent", "reassure", "celebrate"]
ClipStatus = Literal["queued", "processing", "ready", "missing", "failed"]


class ProductDetection(BaseModel):
    name: str
    price: float
    currency: str = "NGN"
    coords: tuple[int, int, int, int]


class PriceAnalysis(BaseModel):
    cheapest_option: float
    savings: float
    suggestion: str


class UiAction(BaseModel):
    highlight_coords: tuple[int, int, int, int]
    action_type: ActionType
    target: str
    message: str | None = None
    code: str | None = None


class StartSessionRequest(BaseModel):
    pass


class SessionModel(BaseModel):
    id: str
    user_id: str
    created_at: datetime
    status: Literal["active", "ended"] = "active"
    total_savings: float = 0.0


class StartSessionResponse(BaseModel):
    session: SessionModel
    rtc_config: dict


class EndSessionRequest(BaseModel):
    session_id: str


class UploadScreenshotRequest(BaseModel):
    session_id: str
    screenshot: str = Field(description="Base64 screenshot data URL")


class UploadScreenshotResponse(BaseModel):
    products: list[ProductDetection]
    analysis: PriceAnalysis
    ui_actions: list[UiAction]


class VisionAnalyzeBatchRequest(BaseModel):
    session_id: str
    screenshots: list[str]


class VisionAnalyzeBatchResponse(BaseModel):
    results: list[UploadScreenshotResponse]


class PriceCompareRequest(BaseModel):
    products: list[ProductDetection]


class PriceCompareResponse(BaseModel):
    cheapest_option: float
    savings: float
    suggestion: str


class ViewportSize(BaseModel):
    width: int
    height: int


class UiSuggestRequest(BaseModel):
    products: list[ProductDetection]
    analysis: PriceAnalysis | None = None
    source_size: ViewportSize | None = None
    viewport_size: ViewportSize | None = None


class UiSuggestResponse(BaseModel):
    ui_actions: list[UiAction]


class LiveMessageRequest(BaseModel):
    session_id: str
    transcript: str | None = None
    audio_base64: str | None = None
    products: list[ProductDetection] | None = None
    current_suggestion: str | None = None
    current_cheapest: float | None = None


class LiveMessageResponse(BaseModel):
    speech: str
    intent: str
    confidence: float
    emotion: EmotionTag = "neutral"
    next_action: str | None = None
    ui_actions: list[UiAction] | None = None


class SavingsLogRequest(BaseModel):
    session_id: str
    savings: float
    metadata: dict | None = None


class SavingsLogResponse(BaseModel):
    status: Literal["logged"]


class ClipGenerateRequest(BaseModel):
    session_id: str
    caption: str | None = None
    savings: float | None = None


class ClipGenerateResponse(BaseModel):
    status: ClipStatus
    job_id: str
    progress: int = 0
    clip_url: str | None = None
    error: str | None = None


class ClipStatusResponse(BaseModel):
    status: ClipStatus
    job_id: str
    progress: int = 0
    clip_url: str | None = None
    error: str | None = None


class ClipProcessRequest(BaseModel):
    job_id: str
    session_id: str
    caption: str | None = None
    savings: float | None = None


class LeaderboardEntry(BaseModel):
    user_id: str
    session_id: str
    total_savings: float
    created_at: datetime


class LeaderboardResponse(BaseModel):
    entries: list[LeaderboardEntry]


class UnifiedWsIncoming(BaseModel):
    type: str
    payload: dict | None = None

