from fastapi import APIRouter

router = APIRouter()

@router.get("/")
async def root():
    return {"message": "Medical Appointment Chatbot API is running!"}

@router.get("/health")
async def health():
    return {"status": "healthy"}
