import os
from dotenv import load_dotenv
from pymongo import MongoClient
from langchain_google_genai import ChatGoogleGenerativeAI
from langgraph.checkpoint.mongodb.saver import MongoDBSaver

load_dotenv()

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    api_key=GOOGLE_API_KEY,
    temperature=0.5,
)

client = MongoClient("mongodb://localhost:27017")
db = client["clinic_ai"]
collection = db["chat_threads"]
checkpointer = MongoDBSaver(collection)
