from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from models.schemas import ChatRequest, ChatResponse
from core.chatbot_graph import chatbot, streaming_chatbot
import json, asyncio

router = APIRouter(prefix="/chat", tags=["Chat"])

SYSTEM_PROMPT = """You are a Medical Appointment Booking Assistant. Your job is to understand symptoms, match users with the best doctors from the Chroma vector database, and help them book, reschedule, or cancel appointments. You must be polite, clear, and safe.

Rules:
- Never give medical diagnosis or prescriptions.
- For emergency symptoms: advise hospital visit.
- When symptoms are provided, create embeddings and search Chroma for best doctor matches.
- Always show top 2 doctors with name, specialty, experience, and timings.
- Ask for confirmation before booking or rescheduling.
- Tone must be friendly and simple.
- Never hallucinate doctor details; only use database values."""


@router.post("/", response_model=ChatResponse)
async def chat(request: ChatRequest):
    try:
        messages = [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": request.message}
        ]

        response = chatbot.invoke(
            {"messages": messages},
            config={"configurable": {"thread_id": request.thread_id}}
        )

        last_message = response["messages"][-1]
        return ChatResponse(
            response=str(last_message.content),
            thread_id=request.thread_id,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
