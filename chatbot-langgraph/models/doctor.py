# schemas/doctor.py
from pydantic import BaseModel
from typing import Optional, List, Union


class AvailabilitySlot(BaseModel):
    day: str
    startTime: str
    endTime: str


class DoctorRequest(BaseModel):
    doctor_id:str
    name: str
    specialization: str
    experience: int
    availability: List[AvailabilitySlot]
    description: str


class DoctorUpdateRequest(BaseModel):
    name: Optional[str] = None
    specialization: Optional[str] = None
    experience: Optional[int] = None
    availability: Optional[List[AvailabilitySlot]] = None
    description: Optional[str] = None


class DoctorResponse(BaseModel):
    message: str
    doctor: Optional[Union[dict, List[dict]]] = None