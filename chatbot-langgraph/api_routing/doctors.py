# routes/doctor.py
import uuid
from fastapi import APIRouter, HTTPException
from core.chroma import collection, embedder, sanitize_metadata
from models.doctor import DoctorRequest, DoctorUpdateRequest, DoctorResponse

router = APIRouter(prefix="/doctors", tags=["Doctors"])


@router.post("/", response_model=DoctorResponse)
async def add_doctor(body: DoctorRequest):
    try:
        doctor_id = body.doctor_id

        existing = collection.get(ids=[doctor_id])
        if existing["ids"]:
            raise HTTPException(
                status_code=409,
                detail=f"Doctor '{body.name}' already exists."
            )

        doc = body.model_dump()
        # doctor_id already inside doc — no manual injection needed

        embedding = embedder.encode(doc["description"]).tolist()
        collection.add(
            ids=[doctor_id],
            metadatas=[sanitize_metadata(doc)],
            embeddings=[embedding],
            documents=[doc["description"]],
        )

        return {"message": f"Doctor '{body.name}' added successfully.", "doctor": doc}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to add doctor: {str(e)}"
        )


@router.put("/{doctor_id}", response_model=DoctorResponse)
async def update_doctor(doctor_id: str, body: DoctorUpdateRequest):
    try:
        existing = collection.get(ids=[doctor_id])
        if not existing["ids"]:
            raise HTTPException(
                status_code=404,
                detail=f"Doctor with id '{doctor_id}' not found."
            )

        old_meta = existing["metadatas"][0]
        updated_fields = body.model_dump(exclude_none=True)

        if not updated_fields:
            raise HTTPException(
                status_code=400,
                detail="No fields provided to update."
            )

        merged = {**old_meta, **updated_fields}

        description = updated_fields.get("description", old_meta["description"])
        embedding = embedder.encode(description).tolist()

        collection.update(
            ids=[doctor_id],
            metadatas=[sanitize_metadata(merged)],
            embeddings=[embedding],
            documents=[description],
        )

        return {"message": f"Doctor updated successfully.", "doctor": merged}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update doctor: {str(e)}"
        )


@router.delete("/{doctor_id}", response_model=DoctorResponse)
async def delete_doctor(doctor_id: str):
    try:
        existing = collection.get(ids=[doctor_id])
        if not existing["ids"]:
            raise HTTPException(
                status_code=404,
                detail=f"Doctor with id '{doctor_id}' not found."
            )

        collection.delete(ids=[doctor_id])
        return {"message": f"Doctor deleted successfully.", "doctor": None}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete doctor: {str(e)}"
        )


@router.get("/", response_model=DoctorResponse)
async def list_doctors():
    try:
        results = collection.get()

        if not results["ids"]:
            return {"message": "No doctors found.", "doctor": None}

        doctors = [
            {"doctor_id": id_, **meta}
            for id_, meta in zip(results["ids"], results["metadatas"])
        ]

        return {"message": f"{len(doctors)} doctors found.", "doctor": doctors}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve doctors: {str(e)}"
        )


@router.get("/{doctor_id}", response_model=DoctorResponse)
async def get_doctor(doctor_id: str):
    try:
        existing = collection.get(ids=[doctor_id])
        if not existing["ids"]:
            raise HTTPException(
                status_code=404,
                detail=f"Doctor with id '{doctor_id}' not found."
            )

        doctor = {"doctor_id": doctor_id, **existing["metadatas"][0]}
        return {"message": "Doctor found.", "doctor": doctor}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve doctor: {str(e)}"
        )











# # routes/doctor.py
# from fastapi import APIRouter, HTTPException
# from core.chroma import collection, embedder, sanitize_metadata
# from models.doctor import DoctorRequest, DoctorUpdateRequest, DoctorResponse

# router = APIRouter(prefix="/doctors", tags=["Doctors"])


# @router.post("/", response_model=DoctorResponse)
# async def add_doctor(body: DoctorRequest):
#     existing = collection.get(ids=[body.name])
#     if existing["ids"]:
#         raise HTTPException(
#             status_code=409, detail=f"Doctor '{body.name}' already exists."
#         )

#     doc = body.model_dump()
#     embedding = embedder.encode(doc["description"]).tolist()
#     collection.add(
#         ids=[body.name],
#         metadatas=[sanitize_metadata(doc)],
#         embeddings=[embedding],
#         documents=[doc["description"]],
#     )

#     return {"message": f"Doctor '{body.name}' added successfully.", "doctor": doc}


# @router.put("/{doctor_name}", response_model=DoctorResponse)
# async def update_doctor(doctor_name: str, body: DoctorUpdateRequest):
#     existing = collection.get(ids=[doctor_name])
#     if not existing["ids"]:
#         raise HTTPException(
#             status_code=404, detail=f"Doctor '{doctor_name}' not found."
#         )

#     old_meta = existing["metadatas"][0]
#     updated_fields = body.model_dump(exclude_none=True)
#     merged = {**old_meta, **updated_fields}

#     description = updated_fields.get("description", old_meta["description"])
#     embedding = embedder.encode(description).tolist()

#     collection.update(
#         ids=[doctor_name],
#         metadatas=[sanitize_metadata(merged)],
#         embeddings=[embedding],
#         documents=[description],
#     )

#     return {"message": f"Doctor '{doctor_name}' updated successfully.", "doctor": merged}


# @router.delete("/{doctor_name}", response_model=DoctorResponse)
# async def delete_doctor(doctor_name: str):
#     existing = collection.get(ids=[doctor_name])
#     if not existing["ids"]:
#         raise HTTPException(
#             status_code=404, detail=f"Doctor '{doctor_name}' not found."
#         )

#     collection.delete(ids=[doctor_name])
#     return {"message": f"Doctor '{doctor_name}' deleted successfully."}


# # routes/doctor.py

# @router.get("/", response_model=DoctorResponse)
# async def list_doctors():
#     results = collection.get()

#     if not results["ids"]:
#         return {"message": "No doctors found.", "doctor": None}

#     doctors = [
#         {"name": id_, **meta}
#         for id_, meta in zip(results["ids"], results["metadatas"])
#     ]

#     return {"message": f"{len(doctors)} doctors found.", "doctor": doctors} 