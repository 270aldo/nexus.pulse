import importlib.util
import sys
import types
from pathlib import Path

from fastapi.testclient import TestClient

# Provide stub for databutton_app dependency so main.py can be imported
sys.modules["databutton_app"] = types.ModuleType("databutton_app")
sys.modules["databutton_app.mw"] = types.ModuleType("databutton_app.mw")
auth_stub = types.ModuleType("databutton_app.mw.auth_mw")


class User:
    def __init__(self, sub: str = "demo-user-1") -> None:
        self.sub = sub


auth_stub.User = User
auth_stub.AuthConfig = object
auth_stub.get_authorized_user = lambda: User()
sys.modules["databutton_app.mw.auth_mw"] = auth_stub

# Dynamically import backend/main.py as module 'backend_main'
MODULE_PATH = Path(__file__).resolve().parents[1] / "backend" / "main.py"
spec = importlib.util.spec_from_file_location("backend_main", MODULE_PATH)
backend_main = importlib.util.module_from_spec(spec)
spec.loader.exec_module(backend_main)

# Ensure backend modules are importable for demo data
sys.path.append(str(Path(__file__).resolve().parents[1] / "backend"))

from app.demo_data import get_demo_dataset  # noqa: E402


def create_client() -> TestClient:
    app = backend_main.create_app()
    return TestClient(app)


def test_healthkit_sync_demo_mode(monkeypatch):
    monkeypatch.setenv("STAGING_DEMO_MODE", "true")
    dataset = get_demo_dataset().for_user("demo-user-1")
    expected_count = len(dataset.health_metrics)

    client = create_client()
    response = client.post("/routes/api/v1/healthkit/sync", json={})

    assert response.status_code == 200
    payload = response.json()
    assert payload["message"] == "Demo data accepted"
    assert payload["quantity_samples_imported"] == expected_count


def test_ai_coach_messages_demo_mode(monkeypatch):
    monkeypatch.setenv("STAGING_DEMO_MODE", "true")
    dataset = get_demo_dataset().for_user("demo-user-1")
    expected_count = len([m for m in dataset.ai_coach_messages if not m.get("read_at")])

    client = create_client()
    response = client.get("/routes/ai-coach-messages", params={"unread_only": "true"})

    assert response.status_code == 200
    assert len(response.json()) == expected_count
