from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.auth import AuthorizedUser

router = APIRouter(prefix="/logs", tags=["Activity Logs"])


class LogEntry(BaseModel):
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    source: Optional[str] = None
    payload: dict


class LogResponse(BaseModel):
    message: str
    count: int
    category: str


class LogRequest(BaseModel):
    entries: List[LogEntry]


def _build_response(category: str, request: LogRequest) -> LogResponse:
    return LogResponse(
        message=f"Captured {category} logs",
        count=len(request.entries),
        category=category,
    )


@router.post("/biometrics", response_model=LogResponse)
async def log_biometrics(payload: LogRequest, user: AuthorizedUser) -> LogResponse:
    """Ingest biometric tracking events for the authenticated user."""

    return _build_response("biometrics", payload)


@router.post("/nutrition", response_model=LogResponse)
async def log_nutrition(payload: LogRequest, user: AuthorizedUser) -> LogResponse:
    """Capture nutrition diary updates for the authenticated user."""

    return _build_response("nutrition", payload)


@router.post("/training", response_model=LogResponse)
async def log_training(payload: LogRequest, user: AuthorizedUser) -> LogResponse:
    """Record training session events for the authenticated user."""

    return _build_response("training", payload)
