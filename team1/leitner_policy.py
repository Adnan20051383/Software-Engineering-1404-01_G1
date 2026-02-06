from datetime import timedelta
from django.utils import timezone
from .models import Leitner


INTERVAL_DAYS = {
    Leitner.BoxType.NEW: 0,
    Leitner.BoxType.DAY_1: 1,
    Leitner.BoxType.DAYS_3: 3,
    Leitner.BoxType.DAYS_7: 7,
    Leitner.BoxType.MASTERED: None,
}


def next_box_on_correct(current: str) -> str:
    if current == Leitner.BoxType.DAYS_7:
        return Leitner.BoxType.MASTERED
    if current == Leitner.BoxType.MASTERED:
        return Leitner.BoxType.MASTERED

    if current == Leitner.BoxType.NEW:
        return Leitner.BoxType.DAY_1
    if current == Leitner.BoxType.DAY_1:
        return Leitner.BoxType.DAYS_3
    return Leitner.BoxType.DAYS_7


def next_box_on_wrong(current: str) -> str:
    return Leitner.BoxType.NEW


def is_due(*, box_type: str, last_check_date) -> bool:
    if box_type == Leitner.BoxType.MASTERED:
        return True

    days = INTERVAL_DAYS.get(box_type, 0)
    if days is None:
        return False

    if last_check_date is None:
        return True

    due_date = last_check_date + timedelta(days=days)
    return timezone.now().date() >= due_date
