# !pip install langchain-google-genai langgraph langchain langchain-community duckduckgo-search


# !pip install langgraph.checkpoint.sqlite



import sqlite3
import requests
from typing import TypedDict, Annotated

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import BaseMessage
# from langchain_core.tools import tool

from langgraph.graph import StateGraph, START
from langgraph.graph.message import add_messages
from langgraph.prebuilt import ToolNode, tools_condition
from langgraph.checkpoint.sqlite import SqliteSaver

# imports tools
from tools.appointments_booking import appointments_booking
from tools.appointments_cancelling import appointments_cancelling

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


# Add doctors to Chroma DB
for doc in doctors:
    embedding = embedder.encode(doc["description"]).tolist()
    collection.add(
        ids=[doc["name"]],
        metadatas=[doc],
        embeddings=[embedding],
        documents=[doc["description"]]
    )

# appointments_booking_list = []


# @tool
# def appointments_booking(
# #     patient_name: str,
# #     phone_number: str,
# #     doctor_name: str,
# #     appointment_date: str,
# #     appointment_time: str
# # ) -> dict:
# #     """
# #     Book a new medical appointment for a patient.
    
# #     This tool ONLY books a new appointment.
    
# #     Parameters:
# #     - patient_name: Name of the patient
# #     - phone_number: Contact number
# #     - doctor_name: Doctor to book appointment with
# #     - appointment_date: Date of appointment (YYYY-MM-DD)
# #     - appointment_time: Time of appointment (HH:MM)

# #     Returns:
# #     - status: success/error
# #     - message: human-readable result
# #     - appointment: appointment details (when successful)
# #     """

# #     new_appointment = {
# #         "patient_name": patient_name,
# #         "phone_number": phone_number,
# #         "doctor_name": doctor_name,
# #         "appointment_date": appointment_date,
# #         "appointment_time": appointment_time,
# #         "status": "confirmed"
# #     }

# #     # Save in the in-memory appointment list
# #     appointments_booking_list.append(new_appointment)

# #     return {
# #         "status": "success",
# #         "message": f"Appointment booked with {doctor_name} on {appointment_date} at {appointment_time}.",
# #         "appointment": new_appointment
# #     }


# @tool
# def cancellation_booking():
#     pass


# @tool
# def reseduling_booking():
#     pass



@tool
def symptom_checker(user_symptoms: str) -> dict:

    """
    Suggest doctors based on user symptoms.

    Args:
        user_symptoms (str): The symptoms provided by the user.

    Returns:
        dict: A dictionary containing the user symptoms and suggested doctors.
    """

    user_embedding = embedder.encode(user_symptoms).tolist()
    results = collection.query(query_embeddings=[user_embedding], n_results=3)
    suggested_doctors = []
    for name, meta in zip(results['ids'][0], results['metadatas'][0]):
        suggested_doctors.append(meta)
    return {"user_symptoms": user_symptoms, "suggested_doctors": suggested_doctors}



# -----------------------------
# 1. Gemini API Key (Colab Safe)
# -----------------------------
GOOGLE_API_KEY = "AIzaSyB0uWGwvEcvSoYoG-J342H9E_3eCiFMxMQ"

if GOOGLE_API_KEY == "" or GOOGLE_API_KEY == "YOUR_GEMINI_API_KEY_HERE":
    raise Exception("❌ Please add your Gemini API Key before running!")


llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    api_key=GOOGLE_API_KEY,
    temperature=0.5,
)



tools = [symptom_checker, appointments_booking, appointments_cancelling]
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


messages = [
    {"role": "system", "content": system_prompt},
    {"role": "user", "content": "I have a head pain from two days."}
]

respone  = chatbot.invoke(
    {"messages": messages},
    config={"configurable": {"thread_id": "t2"}}
    )

print(respone["messages"][-1].content )
