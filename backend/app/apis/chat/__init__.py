from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import os
import databutton as db
from supabase import create_client, Client

try:
    import openai
except Exception as e:  # openai may not be installed during import time
    openai = None

router = APIRouter(prefix="/chat", tags=["Chat"])

class ChatRequest(BaseModel):
    user_id: str
    message: str

class ChatMessage(BaseModel):
    id: str
    user_id: str
    sender: str
    text_content: str
    created_at: str

class ChatResponse(BaseModel):
    user_message: ChatMessage
    ai_message: ChatMessage


def get_supabase_client() -> Client:
    url = db.secrets.get("SUPABASE_URL")
    key = db.secrets.get("SUPABASE_ANON_KEY")
    if not url or not key:
        raise HTTPException(status_code=500, detail="Supabase configuration missing")
    return create_client(url, key)


def generate_ai_reply(prompt: str) -> str:
    api_key = os.environ.get("OPENAI_API_KEY") or db.secrets.get("OPENAI_API_KEY")
    if not api_key or openai is None:
        # Fallback message if OpenAI isn't configured
        return "Lo siento, el servicio de IA no está disponible en este momento."
    try:
        client = openai.OpenAI(api_key=api_key)
        completion = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "system", "content": "Eres un coach personal"}, {"role": "user", "content": prompt}],
        )
        return completion.choices[0].message.content.strip()
    except Exception as e:
        print(f"OpenAI error: {e}")
        return "Hubo un error al generar la respuesta de la IA."


@router.post("/", response_model=ChatResponse)
async def chat_endpoint(payload: ChatRequest):
    sb = get_supabase_client()

    user_insert = (
        sb.table("chat_messages")
        .insert({"user_id": payload.user_id, "sender": "user", "text_content": payload.message})
        .execute()
    )
    if user_insert.error:
        raise HTTPException(status_code=500, detail="Error saving user message")
    user_msg = user_insert.data[0]

    ai_text = generate_ai_reply(payload.message)
    ai_insert = (
        sb.table("chat_messages")
        .insert({"user_id": payload.user_id, "sender": "ai", "text_content": ai_text})
        .execute()
    )
    if ai_insert.error:
        raise HTTPException(status_code=500, detail="Error saving AI message")
    ai_msg = ai_insert.data[0]

    return {"user_message": user_msg, "ai_message": ai_msg}
