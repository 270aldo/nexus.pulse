import functools
import logging
import os
from http import HTTPStatus
from typing import Any, Annotated

import jwt
from fastapi import Depends, HTTPException, WebSocket, WebSocketException, status
from fastapi.requests import HTTPConnection
from jwt import PyJWKClient
from pydantic import BaseModel, Field
from starlette.requests import Request

from app.demo_data import is_demo_mode

logger = logging.getLogger(__name__)


class AuthConfig(BaseModel):
    jwks_url: str
    audience: str
    header: str = "authorization"


class User(BaseModel):
    sub: str
    email: str | None = None
    name: str | None = None
    role: str | None = None
    raw_claims: dict[str, Any] = Field(default_factory=dict)

    @property
    def user_id(self) -> str:
        return self.sub


def get_auth_config(request: HTTPConnection) -> AuthConfig | None:
    return getattr(request.app.state, "auth_config", None)


AuthConfigDep = Annotated[AuthConfig | None, Depends(get_auth_config)]


def _demo_user() -> User:
    return User(
        sub="demo-user-1",
        email="demo.user@nexus.pulse",
        name="Demo User",
        role="demo",
        raw_claims={},
    )


def _build_supabase_config() -> AuthConfig | None:
    supabase_url = os.getenv("SUPABASE_URL")
    if not supabase_url:
        return None
    jwks_url = f"{supabase_url.rstrip('/')}/auth/v1/.well-known/jwks.json"
    audience = os.getenv("SUPABASE_JWT_AUDIENCE", "authenticated")
    return AuthConfig(jwks_url=jwks_url, audience=audience, header="authorization")


@functools.cache
def _get_jwks_client(url: str) -> PyJWKClient:
    return PyJWKClient(url, cache_keys=True)


def _get_signing_key(url: str, token: str) -> tuple[str, str]:
    client = _get_jwks_client(url)
    signing_key = client.get_signing_key_from_jwt(token)
    key = signing_key.key
    alg = signing_key.algorithm_name
    if alg != "RS256":
        raise ValueError(f"Unsupported signing algorithm: {alg}")
    return key, alg


def _token_from_websocket(request: WebSocket) -> str | None:
    header = "Sec-Websocket-Protocol"
    sep = ","
    prefix = "Authorization.Bearer."
    protocols_header = request.headers.get(header)
    protocols = (
        [h.strip() for h in protocols_header.split(sep)] if protocols_header else []
    )
    for protocol in protocols:
        if protocol.startswith(prefix):
            return protocol.removeprefix(prefix)
    return None


def _token_from_request(request: Request, header: str) -> str | None:
    auth_header = request.headers.get(header)
    if not auth_header:
        return None
    scheme, _, token = auth_header.partition(" ")
    if scheme.lower() != "bearer" or not token:
        return None
    return token


def _extract_token(request: HTTPConnection, header: str) -> str | None:
    if isinstance(request, WebSocket):
        return _token_from_websocket(request)
    if isinstance(request, Request):
        return _token_from_request(request, header)
    return None


def _build_user_from_claims(claims: dict[str, Any]) -> User:
    if not claims or "sub" not in claims:
        raise ValueError("Token payload missing subject")
    metadata = claims.get("user_metadata") or {}
    return User(
        sub=claims["sub"],
        email=claims.get("email"),
        name=claims.get("name") or metadata.get("full_name") or metadata.get("name"),
        role=claims.get("role"),
        raw_claims=claims,
    )


def _decode_with_jwks(token: str, config: AuthConfig) -> dict[str, Any]:
    key, alg = _get_signing_key(config.jwks_url, token)
    issuer = os.getenv("SUPABASE_JWT_ISSUER")
    options: dict[str, Any] = {}
    return jwt.decode(
        token,
        key=key,
        algorithms=[alg],
        audience=config.audience,
        issuer=issuer,
        options=options,
    )


def _decode_with_secret(token: str, secret: str) -> dict[str, Any]:
    audience = os.getenv("JWT_AUDIENCE")
    issuer = os.getenv("JWT_ISSUER")
    return jwt.decode(
        token,
        key=secret,
        algorithms=[os.getenv("JWT_ALGORITHM", "HS256")],
        audience=audience,
        issuer=issuer,
    )


def get_authorized_user(request: HTTPConnection, config: AuthConfigDep = None) -> User:
    if is_demo_mode():
        return _demo_user()

    supabase_config = _build_supabase_config()
    secret = os.getenv("JWT_SECRET_KEY")

    active_configs = [cfg for cfg in [config, supabase_config] if cfg is not None]

    if not active_configs and not secret:
        raise HTTPException(
            status_code=HTTPStatus.INTERNAL_SERVER_ERROR,
            detail="Auth configuration missing",
        )

    header = active_configs[0].header if active_configs else "authorization"
    token = _extract_token(request, header)
    if not token:
        if isinstance(request, WebSocket):
            raise WebSocketException(
                code=status.WS_1008_POLICY_VIOLATION, reason="Not authenticated"
            )
        raise HTTPException(
            status_code=HTTPStatus.UNAUTHORIZED, detail="Not authenticated"
        )

    for cfg in active_configs:
        try:
            claims = _decode_with_jwks(token, cfg)
            return _build_user_from_claims(claims)
        except Exception as exc:
            logger.debug("JWKS auth failed: %s", exc)

    if secret:
        try:
            claims = _decode_with_secret(token, secret)
            return _build_user_from_claims(claims)
        except Exception as exc:
            logger.debug("JWT secret auth failed: %s", exc)

    if isinstance(request, WebSocket):
        raise WebSocketException(
            code=status.WS_1008_POLICY_VIOLATION, reason="Not authenticated"
        )
    raise HTTPException(status_code=HTTPStatus.UNAUTHORIZED, detail="Not authenticated")


AuthorizedUser = Annotated[User, Depends(get_authorized_user)]
