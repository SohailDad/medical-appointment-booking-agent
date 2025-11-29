from datetime import datetime


def validate_time(time_str: str) -> bool:
    # """Validate time format (HH:MM)."""
    """Valid 24-hour HH:MM time."""
    try:
        datetime.strptime(time_str, '%H:%M')
        return True
    except ValueError:
        return False