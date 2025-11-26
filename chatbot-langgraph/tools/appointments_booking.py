from langchain.tools import tool


appointments_booking_list = []


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
    
    This tool ONLY books a new appointment.
    
    Parameters:
    - patient_name: Name of the patient
    - phone_number: Contact number
    - doctor_name: Doctor to book appointment with
    - appointment_date: Date of appointment (YYYY-MM-DD)
    - appointment_time: Time of appointment (HH:MM)

    Returns:
    - status: success/error
    - message: human-readable result
    - appointment: appointment details (when successful)
    """

    new_appointment = {
        "patient_name": patient_name,
        "phone_number": phone_number,
        "doctor_name": doctor_name,
        "appointment_date": appointment_date,
        "appointment_time": appointment_time,
        "status": "confirmed"
    }

    # Save in the in-memory appointment list
    appointments_booking_list.append(new_appointment)

    return {
        "status": "success",
        "message": f"Appointment booked with {doctor_name} on {appointment_date} at {appointment_time}.",
        "appointment": new_appointment
    }
