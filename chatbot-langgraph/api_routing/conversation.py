from fastapi import APIRouter, HTTPException
from core.chatbot_graph import chatbot

router = APIRouter(tags=["Conversation"])

@router.get("/conversation/{thread_id}")
async def get_conversation(thread_id: str):
    try:
        config = {"configurable": {"thread_id": thread_id}}
        state = chatbot.get_state(config)
        return state.values
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
