from datetime import datetime
import re


def clean_time_input(time_str: str) -> str:
    """Normalize whitespace in a user-entered time string."""
    if not isinstance(time_str, str):
        return ""
    return re.sub(r"\s+", " ", time_str.strip())


def normalize_time(time_str: str) -> str | None:
    """Normalize time to 24-hour HH:MM format.

    Supports user input like:
    - 22:00
    - 10pm
    - 10:00pm
    - 10 pm
    - 10:00 pm
    - 10am
    - 10:00am
    - 10 a.m.
    - 10:00 a.m.
    """
    if not isinstance(time_str, str):
        return None

    text = time_str.strip().lower()
    text = re.sub(r"[\.\s]+", "", text)

    try:
        dt = datetime.strptime(text, "%H:%M")
        return dt.strftime("%H:%M")
    except ValueError:
        pass

    for fmt in ["%I%p", "%I:%M%p"]:
        try:
            dt = datetime.strptime(text, fmt)
            return dt.strftime("%H:%M")
        except ValueError:
            continue

    return None


def validate_time(time_str: str) -> bool:
    return normalize_time(time_str) is not None