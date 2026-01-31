from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import uvicorn
import json

from typing import TypedDict, Annotated, Optional, List, AsyncGenerator
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import BaseMessage
from langgraph.graph import StateGraph, START
from langgraph.graph.message import add_messages
from langgraph.prebuilt import ToolNode, tools_condition
from pymongo import MongoClient
from langgraph.checkpoint.mongodb.saver import MongoDBSaver

import os
from dotenv import load_dotenv

load_dotenv()
from tools.appointments_cancelling import appointments_cancelling
from tools.appointments_reschedule import appointments_reschedule
from tools.symptom_checker import symptom_checker
from tools.appointments_booking import appointments_booking

# -----------------------------
# Initialize FastAPI
# -----------------------------
app = FastAPI(title="Medical Appointment Chatbot API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust this in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------------
# Pydantic Models
# -----------------------------
class ChatRequest(BaseModel):
    message: str
    thread_id: Optional[str] = "default"

class ChatResponse(BaseModel):
    response: str
    thread_id: str
    tool_calls: Optional[List[dict]] = None

class ThreadsResponse(BaseModel):
    threads: List[str]

# -----------------------------
# Initialize Chatbot
# -----------------------------
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

if not GOOGLE_API_KEY or GOOGLE_API_KEY == "YOUR_GEMINI_API_KEY_HERE":
    raise Exception("❌ Please add your Gemini API Key before running!")

llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    api_key=GOOGLE_API_KEY,
    temperature=0.5,
)

tools = [symptom_checker, appointments_booking, appointments_cancelling, appointments_reschedule]
llm_with_tools = llm.bind_tools(tools)

# State
class ChatState(TypedDict):
    messages: Annotated[list[BaseMessage], add_messages]

# Chat Node
def chat_node(state: ChatState):
    messages = state["messages"]
    response = llm_with_tools.invoke(messages)
    return {"messages": [response]}

tool_node = ToolNode(tools)

# MongoDB Checkpoint
client = MongoClient("mongodb://localhost:27017")
db = client["clinic_ai"]
collection = db["chat_threads"]
checkpointer = MongoDBSaver(collection)

# Build Graph
graph = StateGraph(ChatState)
graph.add_node("chat_node", chat_node)
graph.add_node("tools", tool_node)
graph.add_edge(START, "chat_node")
graph.add_conditional_edges("chat_node", tools_condition)
graph.add_edge("tools", "chat_node")

chatbot = graph.compile(checkpointer=checkpointer)

# Streaming chatbot (separate for streaming endpoint)
streaming_chatbot = graph.compile(checkpointer=checkpointer)


# System Prompt
SYSTEM_PROMPT = """You are a Medical Appointment Booking Assistant. Your job is to understand symptoms, match users with the best doctors from the Chroma vector database, and help them book, reschedule, or cancel appointments. You must be polite, clear, and safe.

Rules:
- Never give medical diagnosis or prescriptions.
- For emergency symptoms: advise hospital visit.
- When symptoms are provided, create embeddings and search Chroma for best doctor matches.
- Always show top 3 doctors with name, specialty, experience, and timings.
- Ask for confirmation before booking or rescheduling.
- Tone must be friendly and simple.
- Never hallucinate doctor details; only use database values."""



# -----------------------------
# API Endpoints
# -----------------------------
@app.get("/")
async def root():
    return {"message": "Medical Appointment Chatbot API is running!"}




# -----------------------------
# Streaming Helper Functions
# -----------------------------
async def generate_stream(message: str, thread_id: str) -> AsyncGenerator[str, None]:
    """
    Generate streaming responses using Server-Sent Events (SSE) format.
    """
    try:
        # Send initial connection message
        yield f"data: {json.dumps({'type': 'connection', 'status': 'connected'})}\n\n"
        
        messages = [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": message}
        ]
        
        config = {"configurable": {"thread_id": thread_id}}
        
        # Stream the response
        accumulated_text = ""
        tool_calls_detected = []
        
        # Use astream_events for streaming (LangGraph streaming API)
        async for event in streaming_chatbot.astream_events(
            {"messages": messages},
            config=config,
            version="v1"
        ):
            kind = event["event"]
            
            # Handle different event types
            if kind == "on_chat_model_stream":
                # This is a chunk from the LLM
                chunk = event.get("data", {}).get("chunk", {})
                
                if hasattr(chunk, 'content'):
                    content = chunk.content
                    
                    # Handle string content
                    if isinstance(content, str) and content:
                        accumulated_text += content
                        # Send the chunk to the client
                        yield f"data: {json.dumps({'type': 'text', 'content': content})}\n\n"
                        await asyncio.sleep(0.01)  # Small delay for smooth streaming
                    
                    # Handle list content (tool calls)
                    elif isinstance(content, list):
                        for item in content:
                            if isinstance(item, dict):
                                if item.get('type') == 'text':
                                    text = item.get('text', '')
                                    if text:
                                        accumulated_text += text
                                        yield f"data: {json.dumps({'type': 'text', 'content': text})}\n\n"
                                        await asyncio.sleep(0.01)
            
            # Handle tool calls
            elif kind == "on_tool_start":
                tool_name = event.get("name", "")
                tool_input = event.get("data", {}).get("input", {})
                
                tool_calls_detected.append({
                    "name": tool_name,
                    "args": tool_input
                })
                
                # Send tool execution notification
                yield f"data: {json.dumps({'type': 'tool_start', 'tool_name': tool_name})}\n\n"
                await asyncio.sleep(0.01)
            
            elif kind == "on_tool_end":
                tool_name = event.get("name", "")
                # Send tool completion notification
                yield f"data: {json.dumps({'type': 'tool_end', 'tool_name': tool_name})}\n\n"
                await asyncio.sleep(0.01)
        
        # Send completion message
        yield f"data: {json.dumps({'type': 'done', 'thread_id': thread_id, 'tool_calls': tool_calls_detected})}\n\n"
        
    except Exception as e:
        # Send error message
        yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"

# -----------------------------
# API Endpoints
# -----------------------------

# @app.get("/")
# async def root():
#     return {
#         "message": "Medical Appointment Chatbot API - Streaming Enabled",
#         "endpoints": {
#             "streaming": "/chat/stream",
#             "non_streaming": "/chat",
#             "health": "/health"
#         }
#     }

@app.post("/chat/stream")
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





@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Send a message to the chatbot and get a response.
    """
    try:
        messages = [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": request.message}
        ]
        
        response = chatbot.invoke(
            {"messages": messages},
            config={"configurable": {"thread_id": request.thread_id}}
        )
        
        # Extract the last message
        last_message = response["messages"][-1]
        
        # Handle different message types
        response_text = ""
        tool_calls_info = None
        
        if hasattr(last_message, 'content'):
            # If content is a string, use it directly
            if isinstance(last_message.content, str):
                response_text = last_message.content
            # If content is a list (tool use case), extract text parts
            elif isinstance(last_message.content, list):
                text_parts = []
                for item in last_message.content:
                    if isinstance(item, dict):
                        if item.get('type') == 'text':
                            text_parts.append(item.get('text', ''))
                    elif hasattr(item, 'text'):
                        text_parts.append(item.text)
                response_text = '\n'.join(text_parts) if text_parts else "Processing your request..."
        
        # Check for tool calls
        if hasattr(last_message, 'tool_calls') and last_message.tool_calls:
            tool_calls_info = [
                {
                    "name": tc.get("name", ""),
                    "args": tc.get("args", {})
                }
                for tc in last_message.tool_calls
            ]
        
        # If still empty, try to get any available content
        if not response_text:
            response_text = str(last_message.content) if hasattr(last_message, 'content') else "Request processed successfully."
        
        return ChatResponse(
            response=response_text,
            thread_id=request.thread_id,
            tool_calls=tool_calls_info
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing chat: {str(e)}")

@app.get("/threads", response_model=ThreadsResponse)
async def get_threads():
    """
    Retrieve all conversation thread IDs.
    """
    try:
        all_threads = []
        for c in checkpointer.list(None):
            all_threads.append(c.config["configurable"]["thread_id"])
        return ThreadsResponse(threads=all_threads)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving threads: {str(e)}")

@app.delete("/thread/{thread_id}")
async def delete_thread(thread_id: str):
    """
    Delete a specific conversation thread.
    """
    try:
        # Note: MongoDBSaver doesn't have a built-in delete method
        # You may need to delete directly from MongoDB
        collection.delete_many({"thread_id": thread_id})
        return {"message": f"Thread {thread_id} deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting thread: {str(e)}")

@app.get("/health")
async def health_check():
    """
    Health check endpoint.
    """
    return {"status": "healthy", "chatbot": "ready"}

@app.get("/conversation/{thread_id}")
async def get_conversation_history(thread_id: str):
    """
    Get the full conversation history for a thread (useful for debugging).
    """
    try:
        # Get the state for the thread
        config = {"configurable": {"thread_id": thread_id}}
        state = chatbot.get_state(config)
        
        if not state or not state.values.get("messages"):
            return {"thread_id": thread_id, "messages": []}
        
        messages = []
        for msg in state.values["messages"]:
            msg_dict = {
                "role": getattr(msg, "type", "unknown"),
                "content": None,
                "tool_calls": None
            }
            
            # Handle content
            if hasattr(msg, 'content'):
                if isinstance(msg.content, str):
                    msg_dict["content"] = msg.content
                elif isinstance(msg.content, list):
                    msg_dict["content"] = [
                        item if isinstance(item, dict) else {"text": str(item)}
                        for item in msg.content
                    ]
                else:
                    msg_dict["content"] = str(msg.content)
            
            # Handle tool calls
            if hasattr(msg, 'tool_calls') and msg.tool_calls:
                msg_dict["tool_calls"] = msg.tool_calls
            
            messages.append(msg_dict)
        
        return {
            "thread_id": thread_id,
            "messages": messages,
            "message_count": len(messages)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving conversation: {str(e)}")

# -----------------------------
# Run Server
# -----------------------------
if __name__ == "__main__":
    print("🚀 Starting FastAPI server...")
    print("📝 API docs available at: http://localhost:8000/docs")
    uvicorn.run(app, host="0.0.0.0", port=8000)