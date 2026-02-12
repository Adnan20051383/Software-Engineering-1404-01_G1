from django.utils import timezone
from team1.models import Quiz
from team1.policies.quiz_policy import can_take_quiz_today, can_take_quiz_weekly, can_take_quiz_monthly


def create_quiz(user_id, score, quiz_type):
    count = 0
    if quiz_type == 1:  # Daily quiz
        if not can_take_quiz_today(user_id):
            raise ValueError("You cannot take the daily quiz yet. Please try again tomorrow.")
        count = 5
    elif quiz_type == 2:  # Weekly quiz
        if not can_take_quiz_weekly(user_id):
            raise ValueError("You cannot take the weekly quiz yet. Please try again next week.")
        count = 10
    elif quiz_type == 3:  # Monthly quiz
        if not can_take_quiz_monthly(user_id):
            raise ValueError("You cannot take the monthly quiz yet. Please try again next month.")
        count = 15

    quiz = Quiz.objects.create(
        user_id=user_id,
        score=0,
        type=quiz_type,
        date=timezone.now().date(),
        created_at=timezone.now().date(),
        question_count=count,
        correct_count=0
    )
    return quiz


def get_quiz_by_id(quiz_id, user_id):
    # Get a specific quiz by quiz_id and user_id
    try:
        quiz = Quiz.objects.get(quiz_id=quiz_id, user_id=user_id)
        return quiz
    except Quiz.DoesNotExist:
        return None


def get_user_quizzes(user_id, start_date=None, end_date=None):
    quizzes = Quiz.objects.filter(user_id=user_id)

    if start_date:
        quizzes = quizzes.filter(date__gte=start_date)
    if end_date:
        quizzes = quizzes.filter(date__lte=end_date)

    return quizzes


def update_quiz(quiz_id, user_id, score=0, correct_count=0):
    try:
        quiz = Quiz.objects.get(quiz_id=quiz_id, user_id=user_id)
        quiz.score = score
        quiz.correct_count = correct_count
        quiz.save()
        return quiz
    except Quiz.DoesNotExist:
        raise ValueError("Quiz not found or you are not authorized to update this quiz.")


def delete_quiz(quiz_id, user_id):
    try:
        quiz = Quiz.objects.get(quiz_id=quiz_id, user_id=user_id)
        quiz.delete()
    except Quiz.DoesNotExist:
        raise ValueError("Quiz not found or you are not authorized to delete this quiz.")