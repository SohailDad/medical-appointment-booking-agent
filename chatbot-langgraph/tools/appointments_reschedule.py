from langchain.tools import tool
from datetime import datetime



@tool
def reschedule_appointment(
    appointment_id: str,
    new_date: str,
    new_time: str
) -> dict:
    """Reschedule an appointment safely (Production-level)."""

    if not validate_date(new_date):
        return {"status": "error", "message": "Invalid date or date is in the past."}

    if not validate_time(new_time):
        return {"status": "error", "message": "Invalid time format (HH:MM)."}

    for appt in appointments_booking_list:
        if appt["appointment_id"] == appointment_id:

            if appt["status"] == "cancelled":
                return {"status": "error", "message": "Cannot reschedule a cancelled appointment."}

            # Check conflict
            if check_conflict(appt["doctor_name"], new_date, new_time):
                return {
                    "status": "error",
                    "message": f"Doctor already booked at {new_time} on {new_date}."
                }

            # Update
            appt["appointment_date"] = new_date
            appt["appointment_time"] = new_time
            appt["status"] = "rescheduled"
            appt["rescheduled_at"] = datetime.now().isoformat()

            return {
                "status": "success",
                "message": f"Appointment {appointment_id} rescheduled to {new_date} at {new_time}.",
                "appointment": appt
            }

    return {"status": "not_found", "message": "Appointment ID not found."}
