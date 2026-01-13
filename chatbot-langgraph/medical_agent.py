# !pip install langchain-google-genai langgraph langchain langchain-community duckduckgo-search


# !pip install langgraph.checkpoint.sqlite
# !pip install SentenceTransformer Client


import sqlite3
# import requests

from typing import TypedDict, Annotated

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import BaseMessage

from langgraph.graph import StateGraph, START
from langgraph.graph.message import add_messages
from langgraph.prebuilt import ToolNode, tools_condition
from langgraph.checkpoint.sqlite import SqliteSaver
# For mongoDb set up
# from langchain_mongodb import MongoDBSaver
# from pymongo import MongoClient

import os
from dotenv import load_dotenv

load_dotenv()

from tools import symptom_checker, appointments_booking, appointments_cancelling, appointments_reschedule



# -----------------------------
# 1. Gemini API Key (Colab Safe)
# -----------------------------
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

if GOOGLE_API_KEY == "" or GOOGLE_API_KEY == "YOUR_GEMINI_API_KEY_HERE":
    raise Exception("❌ Please add your Gemini API Key before running!")


llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    api_key=GOOGLE_API_KEY,
    temperature=0.5,
)



tools = [symptom_checker, appointments_booking, appointments_cancelling, appointments_reschedule]
llm_with_tools = llm.bind_tools(tools)


# -----------------------------
# 4. State
# -----------------------------
class ChatState(TypedDict):
    messages: Annotated[list[BaseMessage], add_messages]


# -----------------------------
# 5. Chat Node
# -----------------------------
def chat_node(state: ChatState):
    messages = state["messages"]
    response = llm_with_tools.invoke(messages)
    return {"messages": [response]}

tool_node = ToolNode(tools)





# -----------------------------
# 6. SQLite Checkpoint (Colab supported)
# -----------------------------
conn = sqlite3.connect("chatbot.db", check_same_thread=False)
checkpointer = SqliteSaver(conn=conn)

# For Mongo Db setup.
# client = MongoClient("mongodb://localhost:27017")
# db = client["clinic_ai"]
# collection = db["chat_threads"]

# checkpointer = MongoDBSaver(collection)


# -----------------------------
# 7. LangGraph Workflow
# -----------------------------
graph = StateGraph(ChatState)

graph.add_node("chat_node", chat_node)
graph.add_node("tools", tool_node)

graph.add_edge(START, "chat_node")
graph.add_conditional_edges("chat_node", tools_condition)
graph.add_edge("tools", "chat_node")

chatbot = graph.compile(checkpointer=checkpointer)



# -----------------------------
# 8. Helper
# -----------------------------
def retrieve_all_threads():
    all_threads = []
    for c in checkpointer.list(None):
        all_threads.append(c.config["configurable"]["thread_id"])
    return all_threads

print("✅ Chatbot with Gemini is ready in Colab!")

#



system_prompt = """You are a Medical Appointment Booking Assistant. Your job is to understand symptoms, match users with the best doctors from the Chroma vector database, and help them book, reschedule, or cancel appointments. You must be polite, clear, and safe.

Rules:
- Never give medical diagnosis or prescriptions.
- For emergency symptoms: advise hospital visit.
- When symptoms are provided, create embeddings and search Chroma for best doctor matches.
- Always show top 3 doctors with name, specialty, experience, and timings.
- Ask for confirmation before booking or rescheduling.
- Tone must be friendly and simple.
- Never hallucinate doctor details; only use database values."""


while True:
  user_input = input("Enter your message: ")

  messages = [
      {"role": "system", "content": system_prompt},
      {"role": "user", "content": user_input}
  ]

  respone  = chatbot.invoke(
    {"messages": messages},
    config={"configurable": {"thread_id": "t5"}}
    )

  print(respone["messages"][-1].content )

  if user_input.lower() == "exit":
    break





# messages = [
#     {"role": "system", "content": system_prompt},
#     {"role": "user", "content": "I have a head pain from two days."}
# ]

# respone  = chatbot.invoke(
#     {"messages": messages},
#     config={"configurable": {"thread_id": "t2"}}
#     )

# print(respone["messages"][-1].content )
