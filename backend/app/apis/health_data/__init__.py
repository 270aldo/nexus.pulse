\
# Standard library imports
from typing import List, Optional, Dict, Any

# Third-party imports
from fastapi import APIRouter, Depends, HTTPException, Header, Request, status
from pydantic import BaseModel, Field, HttpUrl
from supabase import create_client, Client
import databutton as db

# Attempt to import Supabase/GoTrue specific error
try:
    from gotrue.errors import GoTrueApiError
    print("[AUTH DEBUG] Successfully imported GoTrueApiError.")
except ImportError:
    GoTrueApiError = None # Fallback if not found
    print("[AUTH DEBUG] Could not import GoTrueApiError directly, using generic Exception for Supabase API errors.")


# --- Pydantic Models ---
class DeviceInfo(BaseModel):
    name: Optional[str] = None
    manufacturer: Optional[str] = None
    model: Optional[str] = None
    hardware_version: Optional[str] = Field(None, alias="hardwareVersion")
    software_version: Optional[str] = Field(None, alias="softwareVersion")
    os_version: Optional[str] = Field(None, alias="osVersion") # Added based on common use

class BaseSample(BaseModel):
    external_uuid: str = Field(..., alias="externalUuid")
    sample_type: str = Field(..., alias="sampleType")
    start_date: str = Field(..., alias="startDate") # ISO 8601 datetime string
    end_date: str = Field(..., alias="endDate") # ISO 8601 datetime string
    source_bundle_identifier: Optional[str] = Field(None, alias="sourceBundleIdentifier")
    device_info: Optional[DeviceInfo] = Field(None, alias="deviceInfo")
    metadata: Optional[Dict[str, Any]] = None

class QuantitySample(BaseSample):
    value: float
    unit: str

class CategorySample(BaseSample):
    value: int # Typically an enum-like integer in HealthKit
    # unit for category samples is often implicit or not applicable, but can be added if needed

class WorkoutEvent(BaseModel):
    type: int # Workout event type (e.g., pause, resume)
    date: str # ISO 8601 datetime string
    duration: Optional[float] = None # Seconds, if applicable

class Workout(BaseSample):
    activity_type: str = Field(..., alias="activityType")
    duration: float # Seconds
    total_energy_burned: Optional[float] = Field(None, alias="totalEnergyBurned") # Kilocalories
    total_distance: Optional[float] = Field(None, alias="totalDistance") # Meters
    events: Optional[List[WorkoutEvent]] = None

class HealthKitSyncRequest(BaseModel):
    quantity_samples: Optional[List[QuantitySample]] = Field(None, alias="quantitySamples")
    category_samples: Optional[List[CategorySample]] = Field(None, alias="categorySamples")
    workouts: Optional[List[Workout]] = None

class SyncResponse(BaseModel):
    message: str
    quantity_samples_imported: int = 0
    category_samples_imported: int = 0
    workouts_imported: int = 0

# --- FastAPI Authentication Dependency ---
async def get_current_user_data(request: Request, authorization: Optional[str] = Header(None)) -> Dict[str, Any]:
    print("--- [AUTH DEBUG] get_current_user_data INVOKED (Restored Logic) ---")
    print(f"[AUTH DEBUG] Attempting to get Supabase client...")
    supabase_url = db.secrets.get("SUPABASE_URL")
    supabase_anon_key = db.secrets.get("SUPABASE_ANON_KEY")

    if not supabase_url or not supabase_anon_key:
        print("[AUTH DEBUG] Supabase URL or Anon Key is missing from secrets.")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Supabase configuration missing",
        )
    print(f"[AUTH DEBUG] Supabase URL used: {supabase_url}")

    try:
        print(f"[AUTH DEBUG] Initializing Supabase client with URL: {supabase_url}")
        supabase: Client = create_client(supabase_url, supabase_anon_key)
        print("[AUTH DEBUG] Supabase client initialized.")
    except Exception as e:
        print(f"[AUTH DEBUG] Error initializing Supabase client: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error initializing Supabase client: {e}",
        ) from e

    if not authorization:
        print("[AUTH DEBUG] Authorization header missing from request.")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header missing",
        )
    print(f"[AUTH DEBUG] Authorization header received: {authorization[:30]}...") # Log first 30 chars

    scheme, _, token_value = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token_value:
        print(f"[AUTH DEBUG] Invalid authorization scheme or token missing. Scheme: {scheme}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization scheme or token missing",
        )
    print(f"[AUTH DEBUG] Token received (Bearer): {token_value[:20]}...")

    try:
        print(f"[AUTH DEBUG] Attempting to get user with token: {token_value[:20]}...")
        user_response = supabase.auth.get_user(jwt=token_value)
        print(f"[AUTH DEBUG] Supabase get_user response: {user_response}")
        
        if user_response and user_response.user:
            print(f"[AUTH DEBUG] User successfully authenticated: {user_response.user.id}")
            return user_response.user.model_dump() # FastAPI will convert this to dict
        else:
            print("[AUTH DEBUG] User not found or invalid token based on Supabase response.")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, detail="No access for you. (User not found/invalid token)"
            )
    except GoTrueApiError as e_gotrue: # Specific catch for GoTrueApiError if it was imported
        error_message = str(e_gotrue)
        if hasattr(e_gotrue, 'message') and e_gotrue.message: 
            error_message = e_gotrue.message
        status_code_from_error = e_gotrue.status if hasattr(e_gotrue, 'status') else 401
        print(f"[AUTH DEBUG] GoTrueApiError: Status {status_code_from_error} - Message: {error_message}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail=f"No access for you. (Auth Error: {error_message})"
        ) from e_gotrue
    except Exception as e_generic: # Generic catch for other errors
        print(f"[AUTH DEBUG] Unexpected error during token validation: {type(e_generic).__name__} - {e_generic}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail=f"No access for you. (Unexpected Error: {type(e_generic).__name__})"
        ) from e_generic

# --- Router Setup ---
router = APIRouter(prefix="/api/v1/healthkit", tags=["HealthKit"])

# --- API Endpoint --- 
@router.post("/sync", response_model=SyncResponse) # Path prefix is in router
async def sync_health_kit_data(
    request_data: HealthKitSyncRequest,
    current_user: Dict[str, Any] = Depends(get_current_user_data) # Use the original name
):
    user_id = current_user.get("id") 
    if not user_id:
        print("[SYNC ERROR] User ID not found in token after auth dependency.")
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User ID not available")

    print(f"[SYNC INFO] Starting HealthKit data sync for user_id: {user_id}")

    supabase_url_db = db.secrets.get("SUPABASE_URL")
    supabase_key_db = db.secrets.get("SUPABASE_ANON_KEY") 
    if not supabase_url_db or not supabase_key_db:
        print("[SYNC ERROR] Supabase config missing for DB operations.")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Supabase config missing for DB operations")
    
    supabase_client_db: Client = create_client(supabase_url_db, supabase_key_db)
    print(f"[SYNC INFO] Supabase client for DB operations initialized with URL: {supabase_url_db}")

    imported_counts = {
        "quantity": 0,
        "category": 0,
        "workout": 0
    }

    # Upsert Quantity Samples
    if request_data.quantity_samples:
        quantity_data_to_upsert = []
        for sample in request_data.quantity_samples:
            record = sample.model_dump(by_alias=True)
            record['user_id'] = user_id
            record['device_info'] = sample.device_info.model_dump() if sample.device_info else None
            quantity_data_to_upsert.append(record)
        
        if quantity_data_to_upsert:
            try:
                print(f"[SYNC DEBUG] Upserting {len(quantity_data_to_upsert)} quantity samples for user {user_id}.")
                res = supabase_client_db.table("health_kit_quantity_samples").upsert(quantity_data_to_upsert, on_conflict="external_uuid").execute()
                print(f"[SYNC DEBUG] Quantity upsert response: {res.data[:1] if res.data else 'No data returned'}") # Log only a part
                if res.data:
                    imported_counts["quantity"] = len(res.data)
            except Exception as e:
                print(f"[SYNC ERROR] Error upserting quantity samples: {e}")
    
    # Upsert Category Samples
    if request_data.category_samples:
        category_data_to_upsert = []
        for sample in request_data.category_samples:
            record = sample.model_dump(by_alias=True)
            record['user_id'] = user_id
            record['device_info'] = sample.device_info.model_dump() if sample.device_info else None
            category_data_to_upsert.append(record)
        
        if category_data_to_upsert:
            try:
                print(f"[SYNC DEBUG] Upserting {len(category_data_to_upsert)} category samples for user {user_id}.")
                res = supabase_client_db.table("health_kit_category_samples").upsert(category_data_to_upsert, on_conflict="external_uuid").execute()
                if res.data:
                    imported_counts["category"] = len(res.data)
            except Exception as e:
                print(f"[SYNC ERROR] Error upserting category samples: {e}")

    # Upsert Workouts
    if request_data.workouts:
        workout_data_to_upsert = []
        for workout in request_data.workouts:
            record = workout.model_dump(by_alias=True)
            record['user_id'] = user_id
            record['device_info'] = workout.device_info.model_dump() if workout.device_info else None
            # Convert WorkoutEvent list to dict if present
            if record.get('events') and isinstance(record['events'], list):
                record['events'] = [event.model_dump() for event in record['events']]
            workout_data_to_upsert.append(record)
        
        if workout_data_to_upsert:
            try:
                print(f"[SYNC DEBUG] Upserting {len(workout_data_to_upsert)} workouts for user {user_id}.")
                res = supabase_client_db.table("health_kit_workouts").upsert(workout_data_to_upsert, on_conflict="external_uuid").execute()
                if res.data:
                    imported_counts["workout"] = len(res.data)
            except Exception as e:
                print(f"[SYNC ERROR] Error upserting workouts: {e}")

    print(f"[SYNC INFO] Sync completed for user {user_id}. Imported counts: {imported_counts}")
    return SyncResponse(
        message="HealthKit data sync completed.",
        quantity_samples_imported=imported_counts["quantity"],
        category_samples_imported=imported_counts["category"],
        workouts_imported=imported_counts["workout"]
    )
