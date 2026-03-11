from typing import AsyncGenerator
from core.chatbot_graph import chatbot
import asyncio
import json


SYSTEM_PROMPT = """You are a Medical Appointment Booking Assistant. Your job is to understand symptoms, match users with the best doctors from the Chroma vector database, and help them book, reschedule, or cancel appointments. You must be polite, clear, and safe.

Rules:
- Never give medical diagnosis or prescriptions.
- For emergency symptoms: advise hospital visit.
- When symptoms are provided, create embeddings and search Chroma for best doctor matches.
- Always show top 2 doctors with name, specialty, experience, and timings.
- Ask for confirmation before booking or rescheduling.
- Tone must be friendly and simple.
- Never hallucinate doctor details; only use database values."""

async def generate_stream(message: str, thread_id: str, token: str) -> AsyncGenerator[str, None]:
    """
    Generate streaming responses using Server-Sent Events (SSE) format.
    """
    try:
        # Send initial connection message
        # yield f"data: {json.dumps({'type': 'connection', 'status': 'connected'})}\n\n"
        
        messages = [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": message}
        ]
        
        config = {"configurable": {"thread_id": thread_id,"token": token}}
        
        # Stream the response
        accumulated_text = ""
        # tool_calls_detected = []
        
        # Use astream_events for streaming (LangGraph streaming API)
        async for event in chatbot.astream_events(
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
        #     elif kind == "on_tool_start":
        #         tool_name = event.get("name", "")
        #         tool_input = event.get("data", {}).get("input", {})
                
        #         tool_calls_detected.append({
        #             "name": tool_name,
        #             "args": tool_input
        #         })
                
        #         # Send tool execution notification
        #         yield f"data: {json.dumps({'type': 'tool_start', 'tool_name': tool_name})}\n\n"
        #         await asyncio.sleep(0.01)
            
        #     elif kind == "on_tool_end":
        #         tool_name = event.get("name", "")
        #         # Send tool completion notification
        #         yield f"data: {json.dumps({'type': 'tool_end', 'tool_name': tool_name})}\n\n"
        #         await asyncio.sleep(0.01)
        
        # # Send completion message
        # yield f"data: {json.dumps({'type': 'done', 'thread_id': thread_id, 'tool_calls': tool_calls_detected})}\n\n"
        
    except Exception as e:
        # Send error message
        yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"


