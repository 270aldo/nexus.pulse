from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import datetime

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

# Mock user ID for now, replace with actual dependency later
MOCK_USER_ID = "00000000-0000-0000-0000-000000000000" # Replace with a real UUID or use auth

@router.get("/", response_model=List[AICoachMessageResponse])
def get_ai_coach_messages(
    # current_user_id: str = Depends(get_current_user_id) # Uncomment when auth is ready
) -> List[AICoachMessageResponse]:
    """
    Retrieves AI Coach messages for the authenticated user.
    Currently returns mock data.
    """
    # In a real scenario, you'd fetch this from the ai_coach_messages table in Supabase
    # based on the current_user_id.
    
    # current_user_id will be used here when auth is integrated
    user_id_to_filter = MOCK_USER_ID # Replace with current_user_id

    mock_messages = [
        AICoachMessageResponse(
            id="msg_001",
            user_id=user_id_to_filter,
            title="HRV Dip Detected",
            body="We've noticed a significant dip in your HRV over the past 2 days. Consider prioritizing rest and recovery. A light walk or meditation could be beneficial.",
            message_type="ALERT",
            urgency="HIGH",
            deep_link="/biometric-log-page?metric=hrv",
            created_at=datetime.datetime.now() - datetime.timedelta(hours=2),
            read_at=None
        ),
        AICoachMessageResponse(
            id="msg_002",
            user_id=user_id_to_filter,
            title="Consistent Sleep Schedule",
            body="Great job maintaining a consistent sleep schedule this week! This is key for recovery and cognitive function.",
            message_type="PRAISE",
            urgency="LOW",
            created_at=datetime.datetime.now() - datetime.timedelta(days=1),
            read_at=datetime.datetime.now() - datetime.timedelta(hours=5) # Example of a read message
        ),
        AICoachMessageResponse(
            id="msg_003",
            user_id=user_id_to_filter,
            title="Protein Intake Reminder",
            body="Remember to focus on your protein intake today to support muscle repair, especially after your strength session.",
            message_type="RECOMMENDATION",
            urgency="MEDIUM",
            deep_link="/nutrition-log-page",
            created_at=datetime.datetime.now() - datetime.timedelta(hours=1),
            read_at=None
        ),
        AICoachMessageResponse(
            id="msg_004",
            user_id=user_id_to_filter,
            body="You've hit a new personal best on your squat! Keep up the fantastic work.",
            message_type="PRAISE",
            urgency="MEDIUM",
            created_at=datetime.datetime.now() - datetime.timedelta(days=2, hours=3)
        ),
         AICoachMessageResponse(
            id="msg_005",
            user_id=user_id_to_filter,
            title="Upcoming Check-in",
            body="Don\'t forget your scheduled check-in with your coach tomorrow at 10:00 AM.",
            message_type="INFO",
            urgency="MEDIUM",
            deep_link="/calendar-page", # Assuming a calendar page
            created_at=datetime.datetime.now() - datetime.timedelta(hours=20)
        )
    ]
    
    # Simulate filtering by unread or limit
    # return [msg for msg in mock_messages if msg.read_at is None][:3] 
    return mock_messages[:3] # Return first 3 for brevity in the dashboard
