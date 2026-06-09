# tools/appointments_cancelling.py
import logging
import httpx
from langchain.tools import tool
from langchain_core.runnables import RunnableConfig
from core.config import NEST_BACKEND_URL

logger = logging.getLogger("cancelling_tools")


@tool
def appointments_cancelling(
    appointment_id: str,
    config: RunnableConfig
) -> dict:
    """
    Cancel an existing appointment.

    Args:
        appointment_id (str): ID of the appointment to cancel.

    Returns:
        dict: Success or error message.
    """

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
        response = httpx.delete(
            f"{NEST_BACKEND_URL}/appointments/cancel/{appointment_id}",
            headers=headers,
            timeout=10.0
        )

        # NestJS returns 404 if appointment not found
        if response.status_code == 404:
            return {"status": "error", "message": "Appointment not found."}

        # NestJS returns 409 if already cancelled
        if response.status_code == 409:
            return {"status": "error", "message": "Appointment already cancelled."}

        if response.status_code not in (200, 201):
            logger.error(f"Cancel error: {response.status_code} | {response.text}")
            return {"status": "error", "message": "Cancellation failed. Please try again."}

        logger.info(f"Appointment {appointment_id} cancelled successfully.")

        return {
            "status": "success",
            "message": f"Appointment {appointment_id} cancelled successfully.",
            "appointment": response.json()
        }

    except httpx.TimeoutException:
        logger.error("Cancel timeout.")
        return {"status": "error", "message": "Appointment service timeout."}

    except httpx.RequestError as e:
        logger.error(f"Connection error: {str(e)}")
        return {"status": "error", "message": "Appointment service unavailable."}




# from langchain.tools import tool
# from datetime import datetime


# appointments_booking_list = []

# @tool
# def appointments_cancelling(appointment_id: str) -> dict:
#     """Cancel an appointment using appointment_id (Production-level)."""

#     for appt in appointments_booking_list:
#         if appt["appointment_id"] == appointment_id:

#             if appt["status"] == "cancelled":
#                 return {"status": "error", "message": "Appointment already cancelled."}

#             appt["status"] = "cancelled"
#             appt["cancelled_at"] = datetime.now().isoformat()

#             return {
#                 "status": "success",
#                 "message": f"Appointment {appointment_id} cancelled successfully.",
#                 "appointment": appt
#             }

#     return {"status": "not_found", "message": "Appointment ID not found."}
















