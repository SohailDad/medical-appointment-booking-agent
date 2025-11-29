from langchain.tools import tool
from datetime import datetime
import re
import uuid
from ..utilities import check_conflict, validate_date, validate_time
appointments_booking_list = []


# ==================== HELPER FUNCTIONS ====================

def validate_phone(phone: str) -> bool:
    """Validate phone number format."""
    pattern = r'^\+?[\d\s\-()]{10,}$'
    return bool(re.match(pattern, phone.strip()))


# def validate_date(date_str: str) -> bool:
#     # """Validate date format and ensure it's not in the past."""
#     """Valid YYYY-MM-DD date, not in past."""
#     try:
#         appt_date = datetime.strptime(date_str, '%Y-%m-%d').date()
#         return appt_date >= datetime.now().date()
#     except ValueError:
#         return False


# def validate_time(time_str: str) -> bool:
#     # """Validate time format (HH:MM)."""
#     """Valid 24-hour HH:MM time."""
#     try:
#         datetime.strptime(time_str, '%H:%M')
#         return True
#     except ValueError:
#         return False


# def check_conflict(doctor: str, date: str, time: str) -> bool:
#     """Check if doctor already has appointment at this time."""
#     for appt in appointments_booking_list:
#         if (appt['doctor_name'].lower() == doctor.lower() and
#             appt['appointment_date'] == date and
#             appt['appointment_time'] == time and
#             appt['status'] != 'cancelled'):
#             return True
#     return False


# ==================== APPOINTMENT BOOKING TOOL ====================
@tool
def appointments_booking(
    patient_name: str,
    phone_number: str,
    doctor_name: str,
    appointment_date: str,
    appointment_time: str
) -> dict:
    """
    Book a new medical appointment for a patient.

    Args:
        patient_name (str): Full name of the patient
        phone_number (str): Contact phone number (10+ digits)
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

    # Validate patient name
    if not patient_name or not patient_name.strip():
        return {
            "status": "error",
            "message": "Patient name cannot be empty."
        }

    # Validate phone number
    if not validate_phone(phone_number):
        return {
            "status": "error",
            "message": "Invalid phone number format. Must contain at least 10 digits."
        }

    # Validate doctor name
    if not doctor_name or not doctor_name.strip():
        return {
            "status": "error",
            "message": "Doctor name cannot be empty."
        }

    # Validate date
    if not validate_date(appointment_date):
        return {
            "status": "error",
            "message": "Invalid date or date is in the past. Use YYYY-MM-DD format."
        }

    # Validate time
    if not validate_time(appointment_time):
        return {
            "status": "error",
            "message": "Invalid time format. Use HH:MM in 24-hour format (e.g., 14:30)."
        }

    # Check for scheduling conflicts
    if check_conflict(doctor_name, appointment_date, appointment_time):
        return {
            "status": "error",
            "message": f"Dr. {doctor_name} already has an appointment at {appointment_time} on {appointment_date}. Please choose a different time."
        }

    # Create appointment with unique ID
    appointment_id = str(uuid.uuid4())[:8]
    new_appointment = {
        "appointment_id": appointment_id,
        "patient_name": patient_name.strip(),
        "phone_number": phone_number.strip(),
        "doctor_name": doctor_name.strip(),
        "appointment_date": appointment_date,
        "appointment_time": appointment_time,
        "status": "confirmed",
        "created_at": datetime.now().isoformat()
    }

    # Save to appointments list
    appointments_booking_list.append(new_appointment)

    print(f"Total appointments: {len(appointments_booking_list)}")

    return {
        "status": "success",
        "message": f"Appointment successfully booked with Dr. {doctor_name} on {appointment_date} at {appointment_time}.",
        "appointment": new_appointment,
        "appointment_id": appointment_id
    }



















# from langchain.tools import tool


# appointments_booking_list = []


# @tool
# def appointments_booking(
#     patient_name: str,
#     phone_number: str,
#     doctor_name: str,
#     appointment_date: str,
#     appointment_time: str
# ) -> dict:
#     """
#     Book a new medical appointment for a patient.
    
#     This tool ONLY books a new appointment.
    
#     Parameters:
#     - patient_name: Name of the patient
#     - phone_number: Contact number
#     - doctor_name: Doctor to book appointment with
#     - appointment_date: Date of appointment (YYYY-MM-DD)
#     - appointment_time: Time of appointment (HH:MM)

#     Returns:
#     - status: success/error
#     - message: human-readable result
#     - appointment: appointment details (when successful)
#     """

#     new_appointment = {
#         "patient_name": patient_name,
#         "phone_number": phone_number,
#         "doctor_name": doctor_name,
#         "appointment_date": appointment_date,
#         "appointment_time": appointment_time,
#         "status": "confirmed"
#     }

#     # Save in the in-memory appointment list
#     appointments_booking_list.append(new_appointment)

#     print("total apointment: ",len(appointments_booking_list))
#     return {
#         "status": "success",
#         "message": f"Appointment booked with {doctor_name} on {appointment_date} at {appointment_time}.",
#         "appointment": new_appointment
#     }