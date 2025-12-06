"""Simple authentication utilities for FastAPI dependencies.

The previous implementation relied on an external Databutton middleware. For
the Nexus Pulse backend we validate bearer tokens directly against Supabase and
return a minimal ``User`` model that downstream endpoints can trust.
"""

from typing import Annotated, Optional
import os

from fastapi import Depends, Header, HTTPException, status
from pydantic import BaseModel
from supabase import Client, create_client


class User(BaseModel):
    """Authenticated user information extracted from Supabase."""

    id: str
    email: Optional[str] = None
    role: Optional[str] = None


def _get_supabase_client() -> Client:
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_ANON_KEY")
    if not url or not key:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Supabase configuration missing",
        )
    return create_client(url, key)


def _extract_bearer_token(authorization: str | None) -> str:
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header missing",
        )

    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization scheme",
        )
    return token


async def get_authorized_user(authorization: str = Header(None)) -> User:
    """Validate the bearer token using Supabase and return a ``User`` instance."""

    token = _extract_bearer_token(authorization)

    try:
        client = _get_supabase_client()
    except HTTPException:
        raise
    except Exception as exc:  # pragma: no cover - defensive guard
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to initialize Supabase client: {exc}",
        ) from exc

    try:
        response = client.auth.get_user(jwt=token)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        ) from exc

    supabase_user = getattr(response, "user", None)
    if not supabase_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found for provided token",
        )

    user_data = supabase_user.model_dump()
    user_id = user_data.get("id") or user_data.get("user_id")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User ID missing in token payload",
        )

    return User(
        id=user_id,
        email=user_data.get("email"),
        role=user_data.get("role"),
    )


AuthorizedUser = Annotated[User, Depends(get_authorized_user)]
