from fastapi import APIRouter, HTTPException
from core.chatbot_graph import chatbot

router = APIRouter(tags=["Conversation"])

@router.get("/conversation/{thread_id}")
async def get_conversation(thread_id: str):
    try:
        config = {"configurable": {"thread_id": thread_id}}
        state = chatbot.get_state(config)

        if not state or not state.values:
            raise HTTPException(
                status_code=404,
                detail=f"Thread '{thread_id}' not found"
            )

        return state.values

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving conversation: {str(e)}"
        )