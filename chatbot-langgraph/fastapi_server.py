from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
# from tools.symptom_checker import populate_chroma
from api_routing import chat, health, threads, conversation, doctors

app = FastAPI(title="Medical Appointment Chatbot API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# @app.on_event("startup")
# async def startup():
#     await populate_chroma()

# @app.post("/refresh-doctors")
# async def refresh_doctors():
#     await populate_chroma()

app.include_router(doctors.router)
app.include_router(health.router)
app.include_router(chat.router)
app.include_router(threads.router)
app.include_router(conversation.router)
