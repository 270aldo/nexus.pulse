"""Nutrition endpoints (placeholder)."""

from datetime import date
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/nutrition", tags=["Nutrition"])


class NutritionSummary(BaseModel):
    day: date
    total_calories: int
    total_protein: float
    total_carbs: float
    total_fat: float
    source: str = "mock"


@router.get("/summary", response_model=list[NutritionSummary])
def nutrition_summary() -> list[NutritionSummary]:
    """Return daily nutrition summaries (empty if none loaded)."""
    return []


@router.get("/status")
def nutrition_status() -> dict:
    """Basic health check for nutrition endpoints."""
    return {"status": "ok", "message": "nutrition endpoints ready"}
