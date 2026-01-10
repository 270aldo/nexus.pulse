"""Authentication-related endpoints."""

from fastapi import APIRouter, Request
from pydantic import BaseModel

router = APIRouter(prefix="/auth", tags=["Auth"])


class AuthStatus(BaseModel):
    auth_enabled: bool
    header: str | None


@router.get("/status", response_model=AuthStatus)
def auth_status(request: Request) -> AuthStatus:
    """Return basic authentication configuration status."""
    auth_config = getattr(request.app.state, "auth_config", None)
    header = getattr(auth_config, "header", None) if auth_config else None
    return AuthStatus(auth_enabled=auth_config is not None, header=header)
