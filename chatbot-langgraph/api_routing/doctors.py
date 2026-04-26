# routes/doctor.py
from fastapi import APIRouter, HTTPException
from core.chroma import collection, embedder, sanitize_metadata
from models.doctor import DoctorRequest, DoctorUpdateRequest, DoctorResponse

router = APIRouter(prefix="/doctors", tags=["Doctors"])


@router.post("/", response_model=DoctorResponse)
async def add_doctor(body: DoctorRequest):
    existing = collection.get(ids=[body.name])
    if existing["ids"]:
        raise HTTPException(
            status_code=409, detail=f"Doctor '{body.name}' already exists."
        )

    doc = body.model_dump()
    embedding = embedder.encode(doc["description"]).tolist()
    collection.add(
        ids=[body.name],
        metadatas=[sanitize_metadata(doc)],
        embeddings=[embedding],
        documents=[doc["description"]],
    )

    return {"message": f"Doctor '{body.name}' added successfully.", "doctor": doc}


@router.put("/{doctor_name}", response_model=DoctorResponse)
async def update_doctor(doctor_name: str, body: DoctorUpdateRequest):
    existing = collection.get(ids=[doctor_name])
    if not existing["ids"]:
        raise HTTPException(
            status_code=404, detail=f"Doctor '{doctor_name}' not found."
        )

    old_meta = existing["metadatas"][0]
    updated_fields = body.model_dump(exclude_none=True)
    merged = {**old_meta, **updated_fields}

    description = updated_fields.get("description", old_meta["description"])
    embedding = embedder.encode(description).tolist()

    collection.update(
        ids=[doctor_name],
        metadatas=[sanitize_metadata(merged)],
        embeddings=[embedding],
        documents=[description],
    )

    return {"message": f"Doctor '{doctor_name}' updated successfully.", "doctor": merged}


@router.delete("/{doctor_name}", response_model=DoctorResponse)
async def delete_doctor(doctor_name: str):
    existing = collection.get(ids=[doctor_name])
    if not existing["ids"]:
        raise HTTPException(
            status_code=404, detail=f"Doctor '{doctor_name}' not found."
        )

    collection.delete(ids=[doctor_name])
    return {"message": f"Doctor '{doctor_name}' deleted successfully."}


# routes/doctor.py

@router.get("/", response_model=DoctorResponse)
async def list_doctors():
    results = collection.get()

    if not results["ids"]:
        return {"message": "No doctors found.", "doctor": None}

    doctors = [
        {"name": id_, **meta}
        for id_, meta in zip(results["ids"], results["metadatas"])
    ]

    return {"message": f"{len(doctors)} doctors found.", "doctor": doctors} 