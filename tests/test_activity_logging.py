import importlib.util
from pathlib import Path
import sys
import types

import pytest
from fastapi.testclient import TestClient

BACKEND_PATH = Path(__file__).resolve().parents[1] / "backend"
sys.path.insert(0, str(BACKEND_PATH))

MODULE_PATH = BACKEND_PATH / "main.py"
spec = importlib.util.spec_from_file_location("backend_main_logging", MODULE_PATH)
backend_main = importlib.util.module_from_spec(spec)
spec.loader.exec_module(backend_main)


class FakeSupabaseUser:
    def __init__(self, user_id: str = "user-123", email: str = "user@example.com"):
        self.user_id = user_id
        self.email = email

    def model_dump(self):
        return {"id": self.user_id, "email": self.email}


class FakeAuth:
    def __init__(self, user):
        self._user = user

    def get_user(self, jwt: str):
        # Return namespace similar to supabase client response
        return types.SimpleNamespace(user=self._user)


class FakeClient:
    def __init__(self, user):
        self.auth = FakeAuth(user)


@pytest.fixture()
def supabase_stub(monkeypatch):
    user = FakeSupabaseUser()

    def fake_create_client(url, key):
        return FakeClient(user)

    monkeypatch.setenv("SUPABASE_URL", "https://stub.local")
    monkeypatch.setenv("SUPABASE_ANON_KEY", "stub-key")
    monkeypatch.setattr("app.auth.user.create_client", fake_create_client)
    return user


@pytest.fixture()
def client():
    return TestClient(backend_main.app)


def test_health_check_open(client):
    response = client.get("/routes/system/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_logging_requires_auth(client):
    response = client.post(
        "/routes/logs/biometrics",
        json={"entries": [{"payload": {"steps": 1200}}]},
    )
    assert response.status_code == 401


def test_logging_accepts_valid_token(client, supabase_stub):
    response = client.post(
        "/routes/logs/training",
        headers={"Authorization": "Bearer stub-token"},
        json={"entries": [{"payload": {"duration_minutes": 45}}]},
    )
    assert response.status_code == 200
    body = response.json()
    assert body == {
        "message": "Captured training logs",
        "count": 1,
        "category": "training",
    }

    whoami = client.get(
        "/routes/system/auth-status",
        headers={"Authorization": "Bearer stub-token"},
    )
    assert whoami.status_code == 200
    assert whoami.json()["user_id"] == supabase_stub.user_id
