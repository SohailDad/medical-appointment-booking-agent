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



# @router.get("/clean-conversation/{thread_id}")
# async def get_conversation(thread_id: str):
#     try:
#         config = {"configurable": {"thread_id": thread_id}}
#         state = chatbot.get_state(config)

#         if not state or not state.values:
#             raise HTTPException(status_code=404, detail="Thread not found.")

#         messages = state.values.get("messages", [])

#         #only human and ai messages, skip system and tool messages
#         conversation = [
#             {
#                 "role": "user" if msg.type == "human" else "assistant",
#                 "content": extract_content(msg.content),
#             }
#             for msg in messages
#             if msg.type in ("human", "ai")
#         ]

#         return {
#             "thread_id": thread_id,
#             "count": len(conversation),
#             "conversation": conversation,
#         }

#     except HTTPException:
#         raise
#     except Exception as e:
#         raise HTTPException(
#             status_code=500,
#             detail=f"Error retrieving conversation: {str(e)}"
#         )

# def extract_content(content) -> str:
#     if isinstance(content, str):
#         return content.strip()
#     if isinstance(content, list):
#         return " ".join(
#             item.get("text", "") for item in content if isinstance(item, dict)
#         ).strip()
#     return str(content)
