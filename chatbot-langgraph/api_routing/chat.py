from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from models.schemas import ChatRequest, ChatResponse
# from core.chatbot_graph import chatbot, streaming_chatbot
from utilities.generate_stream import generate_stream

router = APIRouter(prefix="/chat", tags=["Chat"])

@router.post("/", response_model=ChatResponse)
# async def chat(request: ChatRequest):
#     try:
#         messages = [
#             {"role": "system", "content": SYSTEM_PROMPT},
#             {"role": "user", "content": request.message}
#         ]

#         response = chatbot.invoke(
#             {"messages": messages},
#             config={"configurable": {"thread_id": request.thread_id}}
#         )

#         last_message = response["messages"][-1]
#         return ChatResponse(
#             response=str(last_message.content),
#             thread_id=request.thread_id,
#         )
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))


# @router.post("/chat/stream")
async def chat_stream(request: ChatRequest):
    """
    Stream chat responses in real-time using Server-Sent Events (SSE).
    This mimics ChatGPT's streaming behavior.
    
    The response format is SSE (Server-Sent Events):
    - Each message starts with "data: "
    - Messages are JSON encoded
    - Types: 'connection', 'text', 'tool_start', 'tool_end', 'done', 'error'
    """
    return StreamingResponse(
        generate_stream(request.message, request.thread_id),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # Disable nginx buffering
        }
    )
