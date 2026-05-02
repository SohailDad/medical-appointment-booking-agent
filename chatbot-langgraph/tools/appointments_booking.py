from langchain.tools import tool
# from datetime import datetime
import os
import re
import uuid
import logging
import httpx
from dotenv import load_dotenv
from langchain_core.runnables import RunnableConfig
from utilities.check_conflict import check_conflict
from utilities.validate_date import validate_date
from utilities.validate_time import validate_time
from core.chroma import collection, embedder

logger = logging.getLogger("booking_tool")

load_dotenv()
NEST_BACKEND_URL = os.getenv("NEST_BACKEND_URL")


def validate_phone(phone: str) -> bool:
    pattern = r'^\+?[\d\s\-()]{12,}$'
    return bool(re.match(pattern, phone.strip()))



def _get_doctor_id_by_name(doctor_name: str) -> str | None:
    """Internal helper — fetch doctor_id from ChromaDB by name."""
    results = collection.get(
        where={"name": {"$eq": doctor_name}}  # filter by name
    )
    if results["ids"]:
        return results["ids"][0]  # return doctor_id
    return None



@tool
async def appointments_booking(
    patient_name: str,
    phone_number: str,
    doctor_name: str,
    appointment_date: str,
    appointment_time: str,
    config: RunnableConfig
) -> dict:
    """
    Book a new medical appointment for a patient.

    Args:
        patient_name (str): Full name of the patient
        phone_number (str): Contact phone number (12+ digits)
        doctor_name (str): Name of the doctor to book with
        appointment_date (str): Date in YYYY-MM-DD format
        appointment_time (str): Time in HH:MM format (24-hour)

    Returns:
        dict: Dictionary containing:
            - status (str): 'success' or 'error'
            - message (str): Human-readable result message
            - appointment (dict): Appointment details (if successful)
            - appointment_id (str): Unique identifier (if successful)
    """

    # ================= VALIDATION =================

    if not patient_name.strip():
        return {"status": "error", "message": "Patient name cannot be empty."}

    if not validate_phone(phone_number):
        return {"status": "error", "message": "Invalid phone number format."}

    if not doctor_name.strip():
        return {"status": "error", "message": "Doctor name cannot be empty."}

    if not validate_date(appointment_date):
        return {"status": "error", "message": "Invalid or past date."}

    if not validate_time(appointment_time):
        return {"status": "error", "message": "Invalid time format (HH:MM)."}

    # Conflict check should ideally happen in backend DB
    if check_conflict(doctor_name, appointment_date, appointment_time):
        return {
            "status": "error",
            "message": f"Dr. {doctor_name} already has an appointment at that time."
        }

    # ================= CREATE APPOINTMENT =================

    appointment_id = str(uuid.uuid4())[:8]

    thread_id = config.get("configurable", {}).get("thread_id")
    new_appointment = {
        "appointment_id": appointment_id,
        "patient_id":thread_id,
        "patient_name": patient_name.strip(),
        "phone_number": phone_number.strip(),
        "doctor_name": doctor_name.strip(),
        "appointment_date": appointment_date,
        "appointment_time": appointment_time
        # "status": "confirmed",
        # "created_at": datetime.utcnow().isoformat()
    }

    # ================= AUTH =================

    token = config.get("configurable", {}).get("token")

    if not token:
        logger.warning("Missing authentication token")
        return {"status": "error", "message": "Authentication required."}

    headers = {
        "Authorization": f"{token}",
        "Content-Type": "application/json"
    }

    # ================= CALL BACKEND =================


    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                f"{NEST_BACKEND_URL}/appointments/book",
                json=new_appointment,
                headers=headers
            )

        if response.status_code not in (200, 201):
            logger.error(f"Backend error: {response.status_code} | {response.text}")
            return {
                "status": "error",
                "message": "Booking failed. Please try again later."
            }

        logger.info(f"Appointment booked successfully | ID: {appointment_id}")

    except httpx.TimeoutException:
        logger.error("Booking timeout")
        return {"status": "error", "message": "Booking service timeout."}

    except httpx.RequestError as e:
        logger.error(f"Connection error: {str(e)}")
        return {"status": "error", "message": "Booking service unavailable."}

    # ================= SUCCESS =================

    return {
        "status": "success",
        "message": f"Appointment booked with Dr. {doctor_name} on {appointment_date} at {appointment_time}.",
        "appointment_id": appointment_id
    }




























# from langchain.tools import tool
# from datetime import datetime
# import os
# from dotenv import load_dotenv
# import re
# import uuid
# # from utilities import check_conflict, validate_date, validate_time
# from utilities.check_conflict import check_conflict
# from utilities.validate_date import validate_date
# from utilities.validate_time import validate_time
# from langchain_core.runnables import RunnableConfig
# import httpx

# appointments_booking_list = []


# # ==================== HELPER FUNCTIONS ====================

# def validate_phone(phone: str) -> bool:
#     """Validate phone number format."""
#     pattern = r'^\+?[\d\s\-()]{10,}$'
#     return bool(re.match(pattern, phone.strip()))


# # def validate_date(date_str: str) -> bool:
# #     # """Validate date format and ensure it's not in the past."""
# #     """Valid YYYY-MM-DD date, not in past."""
# #     try:
# #         appt_date = datetime.strptime(date_str, '%Y-%m-%d').date()
# #         return appt_date >= datetime.now().date()
# #     except ValueError:
# #         return False


# # def validate_time(time_str: str) -> bool:
# #     # """Validate time format (HH:MM)."""
# #     """Valid 24-hour HH:MM time."""
# #     try:
# #         datetime.strptime(time_str, '%H:%M')
# #         return True
# #     except ValueError:
# #         return False


# # def check_conflict(doctor: str, date: str, time: str) -> bool:
# #     """Check if doctor already has appointment at this time."""
# #     for appt in appointments_booking_list:
# #         if (appt['doctor_name'].lower() == doctor.lower() and
# #             appt['appointment_date'] == date and
# #             appt['appointment_time'] == time and
# #             appt['status'] != 'cancelled'):
# #             return True
# #     return False


# # ==================== APPOINTMENT BOOKING TOOL ====================
# @tool
# def appointments_booking(
#     patient_name: str,
#     phone_number: str,
#     doctor_name: str,
#     appointment_date: str,
#     appointment_time: str,
#     config: RunnableConfig
# ) -> dict:
#     """
#     Book a new medical appointment for a patient.

#     Args:
#         patient_name (str): Full name of the patient
#         phone_number (str): Contact phone number (10+ digits)
#         doctor_name (str): Name of the doctor to book with
#         appointment_date (str): Date in YYYY-MM-DD format
#         appointment_time (str): Time in HH:MM format (24-hour)

#     Returns:
#         dict: Dictionary containing:
#             - status (str): 'success' or 'error'
#             - message (str): Human-readable result message
#             - appointment (dict): Appointment details (if successful)
#             - appointment_id (str): Unique identifier (if successful)
#     """


#     # Validate patient name
#     if not patient_name or not patient_name.strip():
#         return {
#             "status": "error",
#             "message": "Patient name cannot be empty."
#         }

#     # Validate phone number
#     if not validate_phone(phone_number):
#         return {
#             "status": "error",
#             "message": "Invalid phone number format. Must contain at least 10 digits."
#         }

#     # Validate doctor name
#     if not doctor_name or not doctor_name.strip():
#         return {
#             "status": "error",
#             "message": "Doctor name cannot be empty."
#         }

#     # Validate date
#     if not validate_date(appointment_date):
#         return {
#             "status": "error",
#             "message": "Invalid date or date is in the past. Use YYYY-MM-DD format."
#         }

#     # Validate time
#     if not validate_time(appointment_time):
#         return {
#             "status": "error",
#             "message": "Invalid time format. Use HH:MM in 24-hour format (e.g., 14:30)."
#         }

#     # Check for scheduling conflicts
#     if check_conflict(doctor_name, appointment_date, appointment_time):
#         return {
#             "status": "error",
#             "message": f"Dr. {doctor_name} already has an appointment at {appointment_time} on {appointment_date}. Please choose a different time."
#         }

#     # Create appointment with unique ID
#     appointment_id = str(uuid.uuid4())[:8]
#     new_appointment = {
#         "appointment_id": appointment_id,
#         "patient_name": patient_name.strip(),
#         "phone_number": phone_number.strip(),
#         "doctor_name": doctor_name.strip(),
#         "appointment_date": appointment_date,
#         "appointment_time": appointment_time,
#         "status": "confirmed",
#         "created_at": datetime.now().isoformat()
#     }

#     # Save to appointments list
#     appointments_booking_list.append(new_appointment)

#     load_dotenv()
#     NEST_BACKEND_URL = os.getenv("NEST_BACKEND_URL")

#     token = config["configurable"].get("token")


#     header = {"autherization":token}

#     # Save in the database
#     async with httpx.AsyncClient() as client:
#         response = await client.post(f"{NEST_BACKEND_URL}", data = new_appointment, headers=header)


#     # print(f"Total appointments: {len(appointments_booking_list)}")

#     return {
#         "status": "success",
#         "message": f"Appointment successfully booked with Dr. {doctor_name} on {appointment_date} at {appointment_time}.",
#         "appointment": new_appointment,
#         "appointment_id": appointment_id
#     }



