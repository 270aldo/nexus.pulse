import json
import sys
from pathlib import Path

# Ensure backend modules are importable
sys.path.append(str(Path(__file__).resolve().parents[1] / "backend"))

from app.demo_data import (  # noqa: E402
    DemoDataset,
    get_demo_dataset,
    is_demo_mode,
    load_demo_dataset,
    reset_demo_dataset,
)


def test_is_demo_mode(monkeypatch):
    monkeypatch.setenv("STAGING_DEMO_MODE", "true")
    assert is_demo_mode() is True
    monkeypatch.setenv("STAGING_DEMO_MODE", "false")
    assert is_demo_mode() is False


def test_load_demo_dataset_from_file(tmp_path):
    payload = {"users": [{"id": "u1"}], "ai_coach_messages": [], "health_metrics": []}
    dataset_path = tmp_path / "demo.json"
    dataset_path.write_text(json.dumps(payload))

    reset_demo_dataset()
    dataset = load_demo_dataset(dataset_path)
    assert isinstance(dataset, DemoDataset)
    assert dataset.summary()["users"] == 1


def test_get_demo_dataset_uses_cache(monkeypatch):
    reset_demo_dataset()
    dataset = get_demo_dataset()
    assert dataset.summary()["users"] >= 1

    # Force cache reuse by changing env; result should stay the same
    monkeypatch.setenv("STAGING_DEMO_MODE", "true")
    cached = get_demo_dataset()
    assert cached is dataset
