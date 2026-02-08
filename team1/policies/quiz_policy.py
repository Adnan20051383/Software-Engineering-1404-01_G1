from datetime import timedelta
from django.utils import timezone
from ..models import Quiz


def can_take_quiz_today(user_id):
    today = timezone.now().date()
    # Check if the user has already taken today's quiz
    last_quiz = Quiz.objects.filter(user_id=user_id, type=1, date=today).first()
    return last_quiz is None


def can_take_quiz_weekly(user_id):
    last_quiz = Quiz.objects.filter(user_id=user_id, type=2).order_by('-date').first()
    if last_quiz:
        last_quiz_date = last_quiz.date
        # Ensure at least 7 days have passed since the last weekly quiz
        if timezone.now().date() < last_quiz_date + timedelta(days=7):
            return False
    return True


def can_take_quiz_monthly(user_id):
    last_quiz = Quiz.objects.filter(user_id=user_id, type=3).order_by('-date').first()
    if last_quiz:
        last_quiz_date = last_quiz.date
        # Ensure at least 30 days have passed since the last monthly quiz
        if timezone.now().date() < last_quiz_date + timedelta(days=30):
            return False
    return True
