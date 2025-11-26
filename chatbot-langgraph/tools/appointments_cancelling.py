from langchain.tools import tool

appointments_booking_list = []

@tool
def cancel_appointment(patient_name: str = "", phone_number: str = "") -> dict:
    """
    Cancel an existing medical appointment.

    You can cancel an appointment by providing:
    - patient_name OR
    - phone_number (recommended)

    Returns:
    - status: success/not_found/error
    - message: readable info
    """

    # Normalize lowercase for matching
    patient_name_lower = patient_name.lower() if patient_name else None

    for appt in appointments_booking_list:
        # Match by phone number (most reliable)
        if phone_number and appt["phone_number"] == phone_number:
            appointments_booking_list.remove(appt)
            return {
                "status": "success",
                "message": f"Appointment for patient with phone {phone_number} has been cancelled.",
                "appointment_cancelled": appt
            }

        # Match by patient name
        if patient_name and appt["patient_name"].lower() == patient_name_lower:
            appointments_booking_list.remove(appt)
            return {
                "status": "success",
                "message": f"Appointment for {patient_name} has been cancelled.",
                "appointment_cancelled": appt
            }

    # If no match found
    return {
        "status": "not_found",
        "message": "No matching appointment found to cancel."
    }
