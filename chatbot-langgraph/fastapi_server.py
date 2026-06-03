import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
# from tools.symptom_checker import populate_chroma
from api_routing import chat, health, threads, conversation, doctors
from core.config import FASTAPI_HOST, FASTAPI_PORT

app = FastAPI(title="Medical Appointment Chatbot API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(doctors.router)
app.include_router(health.router)
app.include_router(chat.router)
app.include_router(threads.router)
app.include_router(conversation.router)


if __name__ == "__main__":
    uvicorn.run(
        "fastapi_server:app",
        host=FASTAPI_HOST,
        port=FASTAPI_PORT,
        reload=True
    )
