"""Utility helpers for serving mock demo data in staging environments."""

from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any, Dict, List, Optional

DEMO_FLAG_ENV = "STAGING_DEMO_MODE"
_DEFAULT_DATA_PATH = Path(__file__).resolve().parent.parent / "mock_data" / "staging.json"

# Cache to avoid reloading the fixture repeatedly in staging/demo environments
_demo_dataset: Optional["DemoDataset"] = None


def _load_raw_dataset(file_path: Path | None = None) -> Dict[str, Any]:
    """Load demo dataset from disk or fall back to embedded defaults."""
    if file_path and file_path.exists():
        with file_path.open() as f:
            return json.load(f)

    # Minimal defaults to keep demo endpoints functional even if the file is missing
    return {
        "users": [
            {
                "id": "demo-user-1",
                "email": "demo.user@nexus.pulse",
                "name": "Demo User"
            }
        ],
        "ai_coach_messages": [
            {
                "id": "msg-001",
                "user_id": "demo-user-1",
                "title": "Bienvenido a Nexus Pulse",
                "body": "Este entorno es solo para demostración con datos simulados.",
                "message_type": "INFO",
                "urgency": "LOW",
                "created_at": "2024-01-01T10:00:00Z",
                "deep_link": None,
                "read_at": None
            }
        ],
        "health_metrics": [
            {
                "user_id": "demo-user-1",
                "date": "2024-01-01",
                "steps": 10432,
                "sleep_hours": 7.2,
                "resting_heart_rate": 62,
                "calories_burned": 2140
            }
        ]
    }


class DemoDataset:
    """Simple accessor for demo/staging data."""

    def __init__(self, data: Dict[str, Any]):
        self.data = data

    @property
    def users(self) -> List[Dict[str, Any]]:
        return self.data.get("users", [])

    @property
    def ai_coach_messages(self) -> List[Dict[str, Any]]:
        return self.data.get("ai_coach_messages", [])

    @property
    def health_metrics(self) -> List[Dict[str, Any]]:
        return self.data.get("health_metrics", [])

    def summary(self) -> Dict[str, int]:
        return {
            "users": len(self.users),
            "messages": len(self.ai_coach_messages),
            "health_records": len(self.health_metrics),
        }

    def for_user(self, user_id: str) -> "DemoDataset":
        """Return a filtered dataset scoped to a specific user."""
        filtered = {
            "users": [u for u in self.users if u.get("id") == user_id],
            "ai_coach_messages": [m for m in self.ai_coach_messages if m.get("user_id") == user_id],
            "health_metrics": [h for h in self.health_metrics if h.get("user_id") == user_id],
        }
        return DemoDataset(filtered)


def load_demo_dataset(file_path: Path | None = None) -> DemoDataset:
    """Load demo dataset and memoize it for reuse."""
    global _demo_dataset
    dataset_path = file_path or _DEFAULT_DATA_PATH
    _demo_dataset = DemoDataset(_load_raw_dataset(dataset_path))
    return _demo_dataset


def get_demo_dataset(file_path: Path | None = None) -> DemoDataset:
    """Expose the memoized demo dataset, loading it if needed."""
    global _demo_dataset
    if _demo_dataset is None:
        return load_demo_dataset(file_path)
    return _demo_dataset


def reset_demo_dataset() -> None:
    """Reset cached dataset (useful for testing)."""
    global _demo_dataset
    _demo_dataset = None


def is_demo_mode() -> bool:
    """Return True when running in staging/demo mode."""
    return os.getenv(DEMO_FLAG_ENV, "false").lower() in {"1", "true", "yes"}


__all__ = [
    "DemoDataset",
    "get_demo_dataset",
    "is_demo_mode",
    "load_demo_dataset",
    "reset_demo_dataset",
]
