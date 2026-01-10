import json
import importlib.util
from pathlib import Path
import sys
import types

import pytest

# Provide stub for auth middleware dependency so main.py can be imported
stub = types.ModuleType("app.middleware.auth_mw")
stub.AuthConfig = object
stub.User = object
def _dummy():
    pass
stub.get_authorized_user = _dummy
sys.modules["app.middleware.auth_mw"] = stub

# Dynamically import backend/main.py as module 'backend_main'
MODULE_PATH = Path(__file__).resolve().parents[1] / "backend" / "main.py"
spec = importlib.util.spec_from_file_location("backend_main", MODULE_PATH)
backend_main = importlib.util.module_from_spec(spec)
spec.loader.exec_module(backend_main)


def test_get_router_config_missing(monkeypatch):
    # Simulate missing routers.json
    def fake_exists(self):
        return False

    monkeypatch.setattr(Path, "exists", fake_exists)
    cfg = backend_main.get_router_config()
    assert cfg == {}


def test_get_router_config_invalid(monkeypatch):
    data = "{invalid json"

    def fake_exists(self):
        return True

    def fake_open(self, *args, **kwargs):
        from io import StringIO

        return StringIO(data)

    monkeypatch.setattr(Path, "exists", fake_exists)
    monkeypatch.setattr(Path, "open", fake_open)
    with pytest.raises(ValueError):
        backend_main.get_router_config()


def test_is_auth_disabled_missing():
    assert backend_main.is_auth_disabled({}, "missing") is False


def test_is_auth_disabled_valid():
    cfg = {"routers": {"api": {"disableAuth": True}}}
    assert backend_main.is_auth_disabled(cfg, "api") is True
