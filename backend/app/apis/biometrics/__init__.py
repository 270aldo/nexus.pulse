"""Biometrics endpoints (placeholder)."""

from datetime import datetime, timezone
from fastapi import APIRouter
from pydantic import BaseModel, Field

router = APIRouter(prefix="/biometrics", tags=["Biometrics"])


class BiometricsSnapshot(BaseModel):
    captured_at: datetime = Field(..., description="Snapshot timestamp")
    metrics: dict[str, float]
    source: str = "mock"


@router.get("/summary", response_model=list[BiometricsSnapshot])
def biometrics_summary() -> list[BiometricsSnapshot]:
    """Return biometrics snapshots (empty if none loaded)."""
    return []


@router.get("/status")
def biometrics_status() -> dict:
    """Basic health check for biometrics endpoints."""
    return {
        "status": "ok",
        "sample": BiometricsSnapshot(
            captured_at=datetime.now(tz=timezone.utc),
            metrics={"hrv": 52.0, "resting_hr": 61.0},
        ).model_dump(),
    }
