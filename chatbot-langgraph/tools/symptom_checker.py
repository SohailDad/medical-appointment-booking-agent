from langchain.tools import tool
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
