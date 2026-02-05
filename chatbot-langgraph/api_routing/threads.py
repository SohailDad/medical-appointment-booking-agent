from fastapi import HTTPException
from fastapi import APIRouter
from models.schemas import ThreadsResponse
from core.chatbot_graph import chatbot
from core.config import collection, checkpointer

router = APIRouter(tags=["Threads"])

@router.get("/threads", response_model=ThreadsResponse)
async def get_threads():
    try:
        threads = []

        for c in checkpointer.list(None):
            # Different LangGraph versions store this differently
            thread_id = None

            # Case 1: nested configurable
            if "configurable" in c.config:
                thread_id = c.config["configurable"].get("thread_id")

            # Case 2: direct thread_id
            elif "thread_id" in c.config:
                thread_id = c.config.get("thread_id")

            if thread_id:
                threads.append(thread_id)

        # Remove duplicates
        unique_threads = list(set(threads))

        return ThreadsResponse(threads=unique_threads)

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving threads: {str(e)}"
        )

@router.delete("/thread/{thread_id}")
async def delete_thread(thread_id: str):
    try:
        db = collection["checkpointing_db"]

        r1 = db["checkpoints"].delete_many({"thread_id": thread_id})
        r2 = db["checkpoint_writes"].delete_many({"thread_id": thread_id})

        if r1.deleted_count == 0 and r2.deleted_count == 0:
            raise HTTPException(404, f"No thread found: {thread_id}")

        return {
            "message": "Deleted",
            "checkpoints_deleted": r1.deleted_count,
            "writes_deleted": r2.deleted_count
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, str(e))