
from fastapi import FastAPI, Depends
from shared.models.schemas import ProductDetection, PriceAnalysis, UiAction
from .service import UiEngine

app = FastAPI(title="UI Action Engine")

def get_service():
    return UiEngine()

@app.get("/healthz")
async def health():
    return {"status": "ok"}

@app.post("/suggest", response_model=list[UiAction])
async def suggest(
    products: list[ProductDetection],
    analysis: PriceAnalysis,
    service: UiEngine = Depends(get_service)
):
    # TODO: Add source_size/viewport_size support in request
    return service.suggest_actions(products, analysis)
