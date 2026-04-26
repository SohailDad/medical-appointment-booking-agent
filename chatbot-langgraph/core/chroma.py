# core/chroma.py
# from chromadb import Client
import chromadb
from sentence_transformers import SentenceTransformer

client = chromadb.PersistentClient(path="./chroma_db")
collection = client.get_or_create_collection("doctors")
embedder = SentenceTransformer("all-MiniLM-L6-v2")


def sanitize_metadata(doc: dict) -> dict:
    sanitized = {}
    for k, v in doc.items():
        if isinstance(v, (str, int, float, bool)):
            sanitized[k] = v
        elif isinstance(v, list):
            parts = []
            for item in v:
                if isinstance(item, dict):
                    parts.append(
                        f"{item.get('day')} {item.get('startTime')}-{item.get('endTime')}"
                    )
                else:
                    parts.append(str(item))
            sanitized[k] = ", ".join(parts)
        elif isinstance(v, dict):
            sanitized[k] = str(v)
        elif v is None:
            sanitized[k] = ""
        else:
            sanitized[k] = str(v)
    return sanitized