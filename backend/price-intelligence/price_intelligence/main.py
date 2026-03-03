
from fastapi import FastAPI, Depends
from shared.models.schemas import ProductDetection, PriceAnalysis
from .service import PriceEngine

app = FastAPI(title="Price Intelligence")

def get_service():
    return PriceEngine()

@app.get("/healthz")
async def health():
    return {"status": "ok"}

@app.post("/analyze", response_model=PriceAnalysis)
async def analyze(
    products: list[ProductDetection],
    service: PriceEngine = Depends(get_service)
):
    return service.analyze(products)
