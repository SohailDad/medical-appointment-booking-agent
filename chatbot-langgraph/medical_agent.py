# !pip install langchain-google-genai langgraph langchain langchain-community duckduckgo-search


# !pip install langgraph.checkpoint.sqlite



import sqlite3
import requests
from typing import TypedDict, Annotated

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import BaseMessage
from langchain_core.tools import tool

from langgraph.graph import StateGraph, START
from langgraph.graph.message import add_messages
from langgraph.prebuilt import ToolNode, tools_condition
from langgraph.checkpoint.sqlite import SqliteSaver


# !pip install chromadb sentence-transformers


from chromadb import Client
from sentence_transformers import SentenceTransformer

# Initialize Chroma
client = Client()

collection = client.get_or_create_collection("doctors")

# Embedding model
embedder = SentenceTransformer("all-MiniLM-L6-v2")

# Doctor data
doctors = [
    {
        "name": "Dr. Sara Malik",
        "specialty": "Neurologist",
        "experience": "9 years",
        "timings": "Mon-Thu, 10 AM - 3 PM",
        "description": "Specialist in migraine, headache, dizziness, and nervous system disorders."
    },
    {
        "name": "Dr. Ali Khan",
        "specialty": "Cardiologist",
        "experience": "12 years",
        "timings": "Mon-Fri, 9 AM - 2 PM",
        "description": "Specialist in chest pain, hypertension, and heart diseases."
    }
]

