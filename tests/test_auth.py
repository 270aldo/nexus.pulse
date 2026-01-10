import importlib.util
from pathlib import Path

import jwt
from fastapi.testclient import TestClient


MODULE_PATH = Path(__file__).resolve().parents[1] / "backend" / "main.py"
spec = importlib.util.spec_from_file_location("backend_main", MODULE_PATH)
backend_main = importlib.util.module_from_spec(spec)
spec.loader.exec_module(backend_main)


def _build_client(monkeypatch: object) -> TestClient:
    monkeypatch.setenv("JWT_SECRET_KEY", "test-secret")
    monkeypatch.setenv("STAGING_DEMO_MODE", "true")
    monkeypatch.delenv("SUPABASE_URL", raising=False)
    monkeypatch.delenv("SUPABASE_ANON_KEY", raising=False)
    return TestClient(backend_main.create_app())


def test_protected_endpoint_rejects_missing_token(monkeypatch):
    client = _build_client(monkeypatch)

    response = client.get("/routes/ai-coach-messages/")

    assert response.status_code == 401


def test_protected_endpoint_accepts_valid_token(monkeypatch):
    client = _build_client(monkeypatch)
    token = jwt.encode(
        {"sub": "user-123", "email": "user@example.com", "role": "authenticated"},
        "test-secret",
        algorithm="HS256",
    )

    response = client.get(
        "/routes/ai-coach-messages/",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    assert isinstance(response.json(), list)
