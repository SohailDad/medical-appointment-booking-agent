from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse
from models.schemas import ChatRequest, ChatResponse
from utilities.generate_stream import generate_stream




router = APIRouter(prefix="/chat", tags=["Chat"])

@router.post("/", response_model=ChatResponse)
async def chat_stream(request: Request, body: ChatRequest):
    """
    Stream chat responses in real-time using Server-Sent Events (SSE).
    This mimics ChatGPT's streaming behavior.
    
    The response format is SSE (Server-Sent Events):
    - Each message starts with "data: "
    - Messages are JSON encoded
    - Types: 'connection', 'text', 'tool_start', 'tool_end', 'done', 'error'
    """
    # Get Authorization header
    auth_header = request.headers.get("authorization")

    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Unauthorized")

    token = auth_header
    print("token:",token)
    
    return StreamingResponse(
        generate_stream(body.message, body.thread_id, token),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # Disable nginx buffering
        }
    )
