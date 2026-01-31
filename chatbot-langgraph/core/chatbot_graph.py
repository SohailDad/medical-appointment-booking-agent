from typing import TypedDict, Annotated
from langchain_core.messages import BaseMessage
from langgraph.graph import StateGraph, START
from langgraph.graph.message import add_messages
from langgraph.prebuilt import ToolNode, tools_condition
from langgraph.checkpoint.mongodb.saver import MongoDBSaver

from core.config import llm, collection
from tools.appointments_cancelling import appointments_cancelling
from tools.appointments_reschedule import appointments_reschedule
from tools.symptom_checker import symptom_checker
from tools.appointments_booking import appointments_booking

tools = [
    symptom_checker,
    appointments_booking,
    appointments_cancelling,
    appointments_reschedule,
]

llm_with_tools = llm.bind_tools(tools)

class ChatState(TypedDict):
    messages: Annotated[list[BaseMessage], add_messages]

def chat_node(state: ChatState):
    response = llm_with_tools.invoke(state["messages"])
    return {"messages": [response]}

tool_node = ToolNode(tools)

checkpointer = MongoDBSaver(collection)

graph = StateGraph(ChatState)
graph.add_node("chat_node", chat_node)
graph.add_node("tools", tool_node)
graph.add_edge(START, "chat_node")
graph.add_conditional_edges("chat_node", tools_condition)
graph.add_edge("tools", "chat_node")

# chatbot = graph.compile(checkpointer=checkpointer)
streaming_chatbot = graph.compile(checkpointer=checkpointer)
