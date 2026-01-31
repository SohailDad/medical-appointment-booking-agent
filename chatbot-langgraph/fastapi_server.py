from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api_routing import chat, health, threads, conversation

app = FastAPI(title="Medical Appointment Chatbot API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(chat.router)
app.include_router(threads.router)
app.include_router(conversation.router)
