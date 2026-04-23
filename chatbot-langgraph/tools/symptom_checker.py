from langchain.tools import tool
from chromadb import Client
from sentence_transformers import SentenceTransformer
from core.config import collection1
import asyncio

# Initialize Chroma
client = Client()
collection = client.get_or_create_collection("doctors")

# Embedding model
embedder = SentenceTransformer("all-MiniLM-L6-v2")


async def get_doctors():
    cursor = collection1.find(
        {},
        {
            "name": 1,
            "specialization": 1,
            "experience": 1,
            "availability": 1,
            "description": 1,
            "_id": 0,
        }
    )
    return await cursor.to_list()


async def populate_chroma():
    """Fetch doctors from MongoDB and populate ChromaDB."""
    doctors = await get_doctors()

    if not doctors:
        print("Warning: No doctors found in the database.")
        return

    for doc in doctors:
        print("Doctor:", doc)

        # Skip docs missing required fields
        if not doc.get("description") or not doc.get("name"):
            print(f"Skipping incomplete record: {doc}")
            continue

        embedding = embedder.encode(doc["description"]).tolist()
        collection.add(
            ids=[doc["name"]],
            metadatas=[{k: str(v) for k, v in doc.items()}],  # Chroma requires string metadata values
            embeddings=[embedding],
            documents=[doc["description"]]
        )

    print(f"Populated ChromaDB with {len(doctors)} doctors.")


# Run at startup
asyncio.run(populate_chroma())


@tool
def symptom_checker(user_symptoms: str) -> dict:
    """
    Suggest doctors based on user symptoms.

    Args:
        user_symptoms (str): The symptoms provided by the user.

    Returns:
        dict: A dictionary containing the user symptoms and suggested doctors.
    """
    if not user_symptoms.strip():
        return {"error": "No symptoms provided.", "suggested_doctors": []}

    user_embedding = embedder.encode(user_symptoms).tolist()
    results = collection.query(query_embeddings=[user_embedding], n_results=3)

    suggested_doctors = [
        meta for meta in results["metadatas"][0]
    ]

    return {"user_symptoms": user_symptoms, "suggested_doctors": suggested_doctors}







# from langchain.tools import tool
# from chromadb import Client
# from sentence_transformers import SentenceTransformer
# from core.config import collection1
# import asyncio

# # Initialize Chroma
# client = Client()

# collection = client.get_or_create_collection("doctors")

# # Embedding model
# embedder = SentenceTransformer("all-MiniLM-L6-v2")


# async def get_doctors():
#     cursor = collection1.find(
#         {},
#         {
#             "name": 1,
#             "specialization": 1,
#             "experience": 1,
#             "availability": 1,
#             "description": 1,
#             "_id": 0,
#         }
#     )

#     return await cursor.to_list()

# # doctors = asyncio.run(get_doctors())
# doctors = get_doctors()

# for doc in doctors:
#     print("doctors: ",doc)


# # Doctor data
# doctors = [
#     {
#         "name": "Dr. Sara Malik",
#         "specialty": "Neurologist",
#         "experience": "9 years",
#         "timings": "Mon-Thu, 10 AM - 3 PM",
#         "description": "Specialist in migraine, headache, dizziness, and nervous system disorders."
#     },
#     {
#         "name": "Dr. Ali Khan",
#         "specialty": "Cardiologist",
#         "experience": "12 years",
#         "timings": "Mon-Fri, 9 AM - 2 PM",
#         "description": "Specialist in chest pain, hypertension, and heart diseases."
#     },
#     {
#         "name": "Dr. Ahmed Raza",
#         "specialty": "General Physician",
#         "experience": "7 years",
#         "timings": "Mon-Sat, 9 AM - 5 PM",
#         "description": "Treats fever, infection, flu, stomach pain, and general medical conditions."
#     },
#     {
#         "name": "Dr. Sana Tariq",
#         "specialty": "Dermatologist",
#         "experience": "8 years",
#         "timings": "Tue-Fri, 11 AM - 4 PM",
#         "description": "Specialist in acne, skin allergies, rashes, hair fall, and cosmetic dermatology."
#     },
#     {
#         "name": "Dr. Bilal Hussain",
#         "specialty": "Orthopedic Surgeon",
#         "experience": "15 years",
#         "timings": "Mon-Thu, 12 PM - 6 PM",
#         "description": "Treats joint pain, fractures, arthritis, back pain, and bone injuries."
#     },
#     {
#         "name": "Dr. Hina Gul",
#         "specialty": "Pediatrician",
#         "experience": "10 years",
#         "timings": "Mon-Sat, 10 AM - 3 PM",
#         "description": "Specialist in child health, cough, fever, infections, and child development issues."
#     },
#     {
#         "name": "Dr. Kamran Javed",
#         "specialty": "ENT Specialist",
#         "experience": "11 years",
#         "timings": "Mon-Fri, 1 PM - 6 PM",
#         "description": "Expert in ear pain, sore throat, tonsillitis, sinus issues, hearing problems."
#     },
#     {
#         "name": "Dr. Fatima Shah",
#         "specialty": "Gynecologist",
#         "experience": "13 years",
#         "timings": "Tue-Sat, 9 AM - 2 PM",
#         "description": "Specialist in women's health, pregnancy care, hormonal imbalance, and menstrual problems."
#     },
#     {
#         "name": "Dr. Usman Khalid",
#         "specialty": "Psychiatrist",
#         "experience": "9 years",
#         "timings": "Mon-Thu, 2 PM - 7 PM",
#         "description": "Treats depression, anxiety, stress, sleep issues, and mental health disorders."
#     },
#     {
#         "name": "Dr. Maria Asad",
#         "specialty": "Endocrinologist",
#         "experience": "12 years",
#         "timings": "Mon-Fri, 10 AM - 1 PM",
#         "description": "Expert in diabetes, thyroid disorders, hormonal imbalance, and metabolic diseases."
#     },
#     {
#         "name": "Dr. Zafar Iqbal",
#         "specialty": "Gastroenterologist",
#         "experience": "14 years",
#         "timings": "Mon-Sat, 8 AM - 12 PM",
#         "description": "Specialist in stomach pain, acidity, ulcers, IBS, liver problems, and digestion issues."
#     },
#     {
#         "name": "Dr. Mehwish Khan",
#         "specialty": "Ophthalmologist",
#         "experience": "6 years",
#         "timings": "Tue-Fri, 10 AM - 4 PM",
#         "description": "Treats eye infections, vision issues, dryness, redness, and performs basic eye exams."
#     }
# ]


# # Add doctors to Chroma DB
# for doc in doctors:
#     embedding = embedder.encode(doc["description"]).tolist()
#     collection.add(
#         ids=[doc["name"]],
#         metadatas=[doc],
#         embeddings=[embedding],
#         documents=[doc["description"]]
#     )

# @tool
# def symptom_checker(user_symptoms: str) -> dict:

#     """
#     Suggest doctors based on user symptoms.

#     Args:
#         user_symptoms (str): The symptoms provided by the user.

#     Returns:
#         dict: A dictionary containing the user symptoms and suggested doctors.
#     """

#     user_embedding = embedder.encode(user_symptoms).tolist()
#     results = collection.query(query_embeddings=[user_embedding], n_results=3)
#     suggested_doctors = []
#     for name, meta in zip(results['ids'][0], results['metadatas'][0]):
#         suggested_doctors.append(meta)
#     return {"user_symptoms": user_symptoms, "suggested_doctors": suggested_doctors}
