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




from datetime import datetime

@router.get("/conversation-clean/{thread_id}")
async def get_clean_conversation(thread_id: str):
    try:
        config = {"configurable": {"thread_id": thread_id}}
        state = chatbot.get_state(config)

        if not state or not state.values:
            raise HTTPException(status_code=404, detail="Thread not found")

        messages = state.values.get("messages", [])

        cleaned_messages = []

        for i, msg in enumerate(messages):
            cleaned_messages.append({
                "id": f"msg_{i+1}",
                "role": _map_role(msg.type),
                "content": extract_content(msg.content),
            })

        return {
            "thread_id": thread_id,
            "count": len(cleaned_messages),
            "messages": cleaned_messages
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving conversation: {str(e)}"
        )



def _map_role(msg_type: str) -> str:
    return {
        "human": "user",
        "ai": "assistant",
        "system": "system"
    }.get(msg_type, "assistant")


def _extract_time(msg):
    if hasattr(msg, "additional_kwargs"):
        return msg.additional_kwargs.get("timestamp")

    if hasattr(msg, "response_metadata"):
        return msg.response_metadata.get("created_at")

    return None



def extract_content(content):
    if isinstance(content, str):
        return content.strip()

    if isinstance(content, list):
        # Gemini / LangChain structured output
        texts = []
        for item in content:
            if isinstance(item, dict):
                texts.append(item.get("text", ""))
        return " ".join(texts).strip()

    return str(content)


    