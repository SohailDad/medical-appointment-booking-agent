import os
from dotenv import load_dotenv
from pymongo import MongoClient
from langchain_google_genai import ChatGoogleGenerativeAI
from langgraph.checkpoint.mongodb.saver import MongoDBSaver

load_dotenv()

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
MONGO_URL = os.getenv("MONGO_URL")
NEST_BACKEND_URL = os.getenv("NEST_BACKEND_URL")
FASTAPI_HOST = os.getenv("FASTAPI_HOST")
FASTAPI_PORT = int(os.getenv("FASTAPI_PORT"))

llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    api_key=GOOGLE_API_KEY,
    temperature=0.5,
)
# gemini-2.5-flash


client = MongoClient(MONGO_URL)
db = client["clinic_ai"]
collection = db["chat_threads"]
checkpointer = MongoDBSaver(collection)

