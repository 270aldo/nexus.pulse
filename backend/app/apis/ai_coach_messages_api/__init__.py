import datetime
import os
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from supabase import create_client, Client
from app.auth import AuthorizedUser
from app.demo_data import get_demo_dataset, is_demo_mode

# Import get_current_user_id if you have it defined in an accessible auth utility
# For now, we'll mock it or assume it's passed if needed.
# from app.dependencies import get_current_user_id # Example, adjust as per your auth setup

router = APIRouter(
    prefix="/ai-coach-messages",
    tags=["AI Coach Messages"],
)

class AICoachMessageResponse(BaseModel):
    id: str
    user_id: str
    title: Optional[str] = None
    body: str
    message_type: str # ALERT, INFO, RECOMMENDATION, PRAISE, MOTIVATION, WARNING, ERROR
    urgency: str # LOW, MEDIUM, HIGH
    deep_link: Optional[str] = None
    created_at: datetime.datetime
    read_at: Optional[datetime.datetime] = None


@router.get("/", response_model=List[AICoachMessageResponse])
def get_ai_coach_messages(
    unread_only: bool = False,
    user: AuthorizedUser = Depends(),
) -> List[AICoachMessageResponse]:
    """Return AI Coach messages for the authenticated user."""

    if is_demo_mode():
        dataset = get_demo_dataset().for_user(user.sub if user else "demo-user-1")
        messages = dataset.ai_coach_messages
        if unread_only:
            messages = [m for m in messages if not m.get("read_at")]
        return [AICoachMessageResponse(**record) for record in messages]

    supabase_url = os.environ.get("SUPABASE_URL")
    supabase_key = os.environ.get("SUPABASE_ANON_KEY")

    if not supabase_url or not supabase_key:
        raise HTTPException(status_code=500, detail="Supabase configuration missing")

    client: Client = create_client(supabase_url, supabase_key)

    try:
        query = client.table("ai_coach_messages").select("*").eq("user_id", user.sub)
        if unread_only:
            query = query.is_("read_at", None)
        response = query.order("created_at").execute()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Error fetching messages: {exc}") from exc

    records = response.data or []
    return [AICoachMessageResponse(**record) for record in records]
