"""Training endpoints (placeholder)."""

from datetime import date
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/training", tags=["Training"])


class TrainingSessionSummary(BaseModel):
    day: date
    sessions_completed: int
    sessions_planned: int
    source: str = "mock"


@router.get("/summary", response_model=list[TrainingSessionSummary])
def training_summary() -> list[TrainingSessionSummary]:
    """Return training summaries (empty if none loaded)."""
    return []


@router.get("/status")
def training_status() -> dict:
    """Basic health check for training endpoints."""
    return {"status": "ok", "message": "training endpoints ready"}
