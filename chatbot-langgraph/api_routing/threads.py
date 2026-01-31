from fastapi import APIRouter
from models.schemas import ThreadsResponse
from core.chatbot_graph import chatbot, checkpointer
from core.config import collection

router = APIRouter(tags=["Threads"])

@router.get("/threads", response_model=ThreadsResponse)
async def get_threads():
    all_threads = [
        c.config["configurable"]["thread_id"]
        for c in checkpointer.list(None)
    ]
    return ThreadsResponse(threads=all_threads)

@router.delete("/thread/{thread_id}")
async def delete_thread(thread_id: str):
    collection.delete_many({"thread_id": thread_id})
    return {"message": "Deleted"}
