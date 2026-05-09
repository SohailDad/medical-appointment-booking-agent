# tools/appointments_reschedule.py
import logging
import httpx
from langchain.tools import tool
from langchain_core.runnables import RunnableConfig
from utilities import validate_date, validate_time  # removed check_conflict
from core.config import NEST_BACKEND_URL


# from core.config import NEST_BACKEND_URL
logger = logging.getLogger("rescheduling_tools")


@tool
def appointments_reschedule(
    appointment_id: str,
    new_date: str,
    new_time: str,
    config: RunnableConfig
) -> dict:
    """
    Reschedule an existing appointment.

    Args:
        appointment_id (str): ID of the appointment to reschedule.
        new_date (str): New date in YYYY-MM-DD format.
        new_time (str): New time in HH:MM format.

    Returns:
        dict: Success or error message.
    """

    # ─────────────────────────────────────────
    # VALIDATE DATE AND TIME
    # ─────────────────────────────────────────

    if not validate_date(new_date):
        return {"status": "error", "message": "Invalid date or date is in the past."}

    if not validate_time(new_time):
        return {"status": "error", "message": "Invalid time format. Use HH:MM."}

    # ─────────────────────────────────────────
    # AUTH
    # ─────────────────────────────────────────

    token = config.get("configurable", {}).get("token")
    if not token:
        logger.warning("Missing authentication token.")
        return {"status": "error", "message": "Authentication required."}

    headers = {
        "Authorization": f"{token}",
        "Content-Type": "application/json"
    }

    # ─────────────────────────────────────────
    # CALL NESTJS — let NestJS handle everything
    # ─────────────────────────────────────────

    try:
        response = httpx.patch(
            f"{NEST_BACKEND_URL}/appointments/{appointment_id}/reschedule",
            json={
                "appointment_date": new_date,
                "appointment_time": new_time,
            },
            headers=headers,
            timeout=10.0
        )

        # NestJS returns 404 if appointment not found
        if response.status_code == 404:
            return {"status": "error", "message": "Appointment not found."}

        # NestJS returns 409 if doctor already booked
        if response.status_code == 409:
            return {
                "status": "error",
                "message": f"Doctor is already booked at {new_time} on {new_date}."
            }

        if response.status_code not in (200, 201):
            logger.error(f"Reschedule error: {response.status_code} | {response.text}")
            return {"status": "error", "message": "Reschedule failed. Please try again."}

        logger.info(f"Appointment {appointment_id} rescheduled to {new_date} at {new_time}.")

        return {
            "status": "success",
            "message": f"Appointment rescheduled to {new_date} at {new_time}.",
            "appointment": response.json()
        }

    except httpx.TimeoutException:
        logger.error("Reschedule timeout.")
        return {"status": "error", "message": "Reschedule service timeout."}

    except httpx.RequestError as e:
        logger.error(f"Connection error: {str(e)}")
        return {"status": "error", "message": "Reschedule service unavailable."}














# from langchain.tools import tool
# from datetime import datetime
# from utilities import check_conflict, validate_date, validate_time
# import httpx
# from langchain_core.runnables import RunnableConfig



# appointments_booking_list = []


# @tool
# def appointments_reschedule(
#     appointment_id: str,
#     new_date: str,
#     new_time: str,
#     config: RunnableConfig
# ) -> dict:
#     """Reschedule an appointment safely (Production-level)."""

#     if not validate_date(new_date):
#         return {"status": "error", "message": "Invalid date or date is in the past."}

#     if not validate_time(new_time):
#         return {"status": "error", "message": "Invalid time format (HH:MM)."}


    
#     # ================= AUTH =================

#     token = config.get("configurable", {}).get("token")

#     if not token:
#         logger.warning("Missing authentication token")
#         return {"status": "error", "message": "Authentication required."}

#     headers = {
#         "Authorization": f"{token}",
#         "Content-Type": "application/json"
#     }

#     try:
#         async with httpx.AsyncClient(timeout=10.0) as client:
#             response = await client.post(
#                 f"{NEST_BACKEND_URL}/appointments/book",
#                 json=new_appointment,
#                 headers=headers
#             )

#         if response.status_code not in (200, 201):
#             logger.error(f"Backend error: {response.status_code} | {response.text}")
#             return {
#                 "status": "error",
#                 "message": "Booking failed. Please try again later."
#             }

#         logger.info(f"Appointment booked successfully | ID: {appointment_id}")

#     except httpx.TimeoutException:
#         logger.error("Booking timeout")
#         return {"status": "error", "message": "Booking service timeout."}

#     except httpx.RequestError as e:
#         logger.error(f"Connection error: {str(e)}")
#         return {"status": "error", "message": "Booking service unavailable."}


#     for appt in appointments_booking_list:
#         if appt["appointment_id"] == appointment_id:

#             if appt["status"] == "cancelled":
#                 return {"status": "error", "message": "Cannot reschedule a cancelled appointment."}

#             # Check conflict
#             if check_conflict(appt["doctor_name"], new_date, new_time):
#                 return {
#                     "status": "error",
#                     "message": f"Doctor already booked at {new_time} on {new_date}."
#                 }

#             # Update
#             appt["appointment_date"] = new_date
#             appt["appointment_time"] = new_time
#             appt["status"] = "rescheduled"
#             appt["rescheduled_at"] = datetime.now().isoformat()

#             return {
#                 "status": "success",
#                 "message": f"Appointment {appointment_id} rescheduled to {new_date} at {new_time}.",
#                 "appointment": appt
#             }

#     return {"status": "not_found", "message": "Appointment ID not found."}
