
appointments_booking_list = []

def check_conflict(doctor: str, date: str, time: str) -> bool:
    """Check if doctor already has appointment at this time."""
    for appt in appointments_booking_list:
        if (appt['doctor_name'].lower() == doctor.lower() and
            appt['appointment_date'] == date and
            appt['appointment_time'] == time and
            appt['status'] != 'cancelled'):
            return True
    return False