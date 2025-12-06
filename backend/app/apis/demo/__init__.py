"""Demo/staging endpoints backed by mock data."""

from fastapi import APIRouter, Depends

from app.demo_data import DemoDataset, get_demo_dataset, is_demo_mode

router = APIRouter(prefix="/demo", tags=["Demo/Staging"])


def _dataset(_: bool = Depends(is_demo_mode)) -> DemoDataset:
    # Force dataset load only when demo mode is explicitly enabled
    if not is_demo_mode():
        return DemoDataset({})
    return get_demo_dataset()


@router.get("/status")
def demo_status(dataset: DemoDataset = Depends(_dataset)) -> dict:
    """Basic health and inventory of demo data."""
    return {
        "demo_mode": is_demo_mode(),
        "counts": dataset.summary(),
    }


@router.get("/messages")
def demo_messages(dataset: DemoDataset = Depends(_dataset)) -> dict:
    return {"items": dataset.ai_coach_messages}


@router.get("/health-metrics")
def demo_health_metrics(dataset: DemoDataset = Depends(_dataset)) -> dict:
    return {"items": dataset.health_metrics}
