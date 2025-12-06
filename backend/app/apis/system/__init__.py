from fastapi import APIRouter

from app.auth import AuthorizedUser

router = APIRouter(prefix="/system", tags=["System"])


@router.get("/health")
async def health_check() -> dict[str, str]:
    """Simple liveness probe used by uptime checks."""

    return {"status": "ok"}


@router.get("/auth-status")
async def auth_status(user: AuthorizedUser) -> dict[str, str]:
    """Return basic information confirming the caller is authenticated."""

    return {"status": "authenticated", "user_id": user.id}
