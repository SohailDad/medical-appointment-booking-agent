from pydantic import BaseModel
from typing import Optional, List

class ChatRequest(BaseModel):
    message: str
    thread_id: Optional[str] = "default"

class ChatResponse(BaseModel):
    response: str
    thread_id: str
    tool_calls: Optional[List[dict]] = None

class ThreadsResponse(BaseModel):
    threads: List[str]
