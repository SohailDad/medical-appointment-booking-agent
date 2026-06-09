from utilities.validate_time import normalize_time

appointments_booking_list = []

def check_conflict(doctor: str, date: str, time: str) -> bool:
    """Check if doctor already has appointment at this time."""
    normalized_time = normalize_time(time)
    if not normalized_time:
        return False

    for appt in appointments_booking_list:
        appt_time = normalize_time(appt.get('appointment_time', ''))
        if (appt['doctor_name'].lower() == doctor.lower() and
            appt['appointment_date'] == date and
            appt_time == normalized_time and
            appt.get('status') != 'cancelled'):
            return True
    return False