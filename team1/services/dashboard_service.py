from django.db.models import Count, Avg
from team1.models import UserWord, Quiz, SurvivalGame

QUIZ_TYPE_DAILY = 1
QUIZ_TYPE_WEEKLY = 2
QUIZ_TYPE_MONTHLY = 3


def get_user_dashboard_stats(*, user_id):
    total_user_words = UserWord.objects.filter(is_deleted=False, user_id=user_id).count()

    box_counts_qs = (
        UserWord.objects
        .filter(is_deleted=False, user_id=user_id)
        .values("leitner_type")  # استفاده از leitner_type جدید
        .annotate(count=Count("user_word_id"))
    )
    box_counts = {row["leitner_type"]: row["count"] for row in box_counts_qs}

    quiz_aggs = (
        Quiz.objects
        .filter(is_deleted=False, user_id=user_id)
        .values("type")
        .annotate(count=Count("quiz_id"), avg_score=Avg("score"))
    )
    quiz_stats = {}
    for row in quiz_aggs:
        t = row["type"]
        quiz_stats[int(t) if t is not None else 0] = {
            "count": row["count"],
            "avg_score": float(row["avg_score"]) if row["avg_score"] is not None else 0.0,
        }

    recent_quizzes = list(
        Quiz.objects
        .filter(is_deleted=False, user_id=user_id)
        .order_by("-date", "-created_at")[:15]
        .values("quiz_id", "type", "score", "date", "created_at")
    )

    game_count = SurvivalGame.objects.filter(is_deleted=False, user_id=user_id).count()
    game_avg = SurvivalGame.objects.filter(is_deleted=False, user_id=user_id).aggregate(avg=Avg("score"))["avg"]
    recent_games = list(
        SurvivalGame.objects
        .filter(is_deleted=False, user_id=user_id)
        .order_by("-date", "-created_at")[:4]
        .values("survival_game_id", "score", "lives", "date", "created_at")
    )

    return {
        "words": {
            "total": total_user_words,
            "by_leitner": {
                "new": box_counts.get('new', 0),
                "1_day": box_counts.get('1day', 0),
                "3_days": box_counts.get('3days', 0),
                "7_days": box_counts.get('7days', 0),
                "mastered": box_counts.get('mastered', 0),
            },
        },
        "quizzes": {
            "daily": quiz_stats.get(QUIZ_TYPE_DAILY, {"count": 0, "avg_score": 0.0}),
            "weekly": quiz_stats.get(QUIZ_TYPE_WEEKLY, {"count": 0, "avg_score": 0.0}),
            "monthly": quiz_stats.get(QUIZ_TYPE_MONTHLY, {"count": 0, "avg_score": 0.0}),
            "recent": recent_quizzes,
        },
        "games": {
            "count": game_count,
            "avg_score": float(game_avg) if game_avg is not None else 0.0,
            "recent": recent_games,
        },
    }
