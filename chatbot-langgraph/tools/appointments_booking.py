from langchain.tools import tool
# from datetime import datetime
import re
import uuid
import logging
import httpx
from dotenv import load_dotenv
from langchain_core.runnables import RunnableConfig
from utilities.validate_date import validate_date
from utilities.validate_time import clean_time_input, normalize_time
from core.chroma import collection, embedder
from core.config import NEST_BACKEND_URL

logger = logging.getLogger("booking_tool")




def validate_phone(phone: str) -> bool:
    """Return True if the phone can be normalized to a Pakistani mobile number."""
    return normalize_phone(phone) is not None


def normalize_phone(phone: str) -> str | None:
    """Normalize a Pakistani mobile number to international format +923XXXXXXXXX.

    Supported inputs:
    - 03001234567
    - 3001234567
    - 923001234567
    - +923001234567
    - 00923001234567
    """
    if not isinstance(phone, str):
        return None

    digits = re.sub(r"\D", "", phone)

    if digits.startswith("00"):
        digits = digits[2:]

    if digits.startswith("92") and len(digits) == 12:
        pass  # already in format 923XXXXXXXXX
    elif digits.startswith("92") and len(digits) == 11:
        pass  # already in format 92XXXXXXXXX
    elif digits.startswith("0") and len(digits) == 11:
        digits = "92" + digits[1:]  # 03XXXXXXXXX -> 923XXXXXXXXX
    elif len(digits) == 10 and digits.startswith("3"):
        digits = "92" + digits  # 3XXXXXXXXX -> 923XXXXXXXXX
    else:
        return None

    if len(digits) == 12 and digits.startswith("92"):
        return "+" + digits

    return None


def validate_age(age: int | str) -> bool:
    """Validate patient age as a whole number between 0 and 120."""
    if isinstance(age, str):
        age = age.strip()
        if not age.isdigit():
            return False
        age = int(age)
    if not isinstance(age, int):
        return False
    return 0 <= age <= 120


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
    patient_age: int | str,
    doctor_name: str,
    appointment_date: str,
    appointment_time: str,
    config: RunnableConfig
) -> dict:
    """
    Book a new medical appointment for a patient.

    Args:
        patient_name (str): Full name of the patient.
        phone_number (str): Pakistani mobile phone number (accepts 0300..., 300..., +92300..., 0092300..., or 92300... formats; normalizes to +923XXXXXXXXX).
        patient_age (int | str): Patient age in years. Must be a whole number between 0 and 120.
        doctor_name (str): Name of the doctor to book with (must exist in database).
        appointment_date (str): Date in YYYY-MM-DD format.
        appointment_time (str): Time in 24-hour HH:MM format or 12-hour AM/PM format (e.g. 10pm, 10:00pm).

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

    # Get doctor_id from ChromaDB
    doctor_id = _get_doctor_id_by_name(doctor_name)
    if not doctor_id:
        return {"status": "error", "message": f"Doctor '{doctor_name}' not found."}

    normalized_phone = normalize_phone(phone_number)
    if not normalized_phone:
        return {"status": "error", "message": "Invalid phone number format. Expect Pakistani number in accepted format."}

    if not validate_age(patient_age):
        return {"status": "error", "message": "Invalid patient age. Must be a whole number between 0 and 120."}

    if not doctor_name.strip():
        return {"status": "error", "message": "Doctor name cannot be empty."}

    appointment_time_raw = clean_time_input(appointment_time)
    normalized_time = normalize_time(appointment_time_raw)
    if not normalized_time:
        return {"status": "error", "message": "Invalid time format. Use 24-hour HH:MM or 12-hour AM/PM (e.g. 10pm)."}

    if not validate_date(appointment_date):
        return {"status": "error", "message": "Invalid or past date."}

    # ================= CREATE APPOINTMENT =================

    appointment_id = str(uuid.uuid4())[:8]

    thread_id = config.get("configurable", {}).get("thread_id")
    
    # Convert age to int
    patient_age_int = int(patient_age) if isinstance(patient_age, str) else patient_age
    new_appointment = {
        "appointment_id": appointment_id,
        "patient_id": thread_id,
        "patient_name": patient_name.strip(),
        "patient_age": patient_age_int,
        "phone_number": normalized_phone,
        "doctor_id": doctor_id,
        "doctor_name": doctor_name.strip(),
        "appointment_date": appointment_date,
        "appointment_time": appointment_time_raw,
        "appointment_time_normalized": normalized_time
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
        "message": f"Appointment booked with Dr. {doctor_name} on {appointment_date} at {appointment_time_raw}.",
        "appointment_id": appointment_id,
        "appointment": new_appointment
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



