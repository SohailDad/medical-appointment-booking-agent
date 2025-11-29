from datetime import datetime


def validate_date(date_str: str) -> bool:
    # """Validate date format and ensure it's not in the past."""
    """Valid YYYY-MM-DD date, not in past."""
    try:
        appt_date = datetime.strptime(date_str, '%Y-%m-%d').date()
        return appt_date >= datetime.now().date()
    except ValueError:
        return False