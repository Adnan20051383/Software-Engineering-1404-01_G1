from django.utils import timezone
from django.core.cache import cache

from team1.models import Word, Quiz, SurvivalGame


def _quiz_cache_key(user_id, quiz_id):
    return f"team1:quiz_questions:{user_id}:{quiz_id}"


def _game_cache_key(user_id, game_id):
    return f"team1:game_questions:{user_id}:{game_id}"


def cache_quiz_questions(*, user_id, quiz_id, word_ids, ttl_seconds=60 * 60):
    cache.set(_quiz_cache_key(user_id, quiz_id), list(word_ids), ttl_seconds)


def cache_game_questions(*, user_id, game_id, word_ids, ttl_seconds=60 * 60 * 6):
    cache.set(_game_cache_key(user_id, game_id), list(word_ids), ttl_seconds)


def get_cached_quiz_question_ids(*, user_id, quiz_id):
    return cache.get(_quiz_cache_key(user_id, quiz_id)) or []


def get_cached_game_question_ids(*, user_id, game_id):
    return cache.get(_game_cache_key(user_id, game_id)) or []


def grade_quiz_answers(*, quiz: Quiz, user_id, answers):
    # Fetch the cached question ids for this quiz
    word_ids = get_cached_quiz_question_ids(user_id=user_id, quiz_id=quiz.quiz_id)

    if not word_ids:
        raise ValueError("No quiz questions cached for this quiz.")

    allowed = set(word_ids)
    by_id = {w.id: w for w in Word.objects.filter(is_deleted=False, id__in=allowed)}

    correct_count = 0
    answered_ids = set()

    for a in answers:
        try:
            q_word_id = int(a.get("word_id"))
            selected_word_id = int(a.get("selected_word_id"))
        except (TypeError, ValueError):
            continue

        if q_word_id not in allowed:
            continue

        if q_word_id in answered_ids:
            continue
        answered_ids.add(q_word_id)

        w = by_id.get(q_word_id)
        if not w:
            continue

        if selected_word_id == w.id:
            correct_count += 1

    question_count = len(allowed)
    score_100 = 0
    if question_count > 0:
        score_100 = int(round((correct_count / question_count) * 100))

    quiz.correct_count = correct_count
    quiz.question_count = question_count
    quiz.score = score_100

    if not quiz.date:
        quiz.date = timezone.now().date()

    quiz.save(update_fields=["correct_count", "question_count", "score", "date", "updated_at"])

    return correct_count, question_count, score_100


def grade_game_answers(*, game: SurvivalGame, user_id, answers):
    # Similar logic as quiz answers but for survival game
    correct_count = 0
    word_ids = get_cached_game_question_ids(user_id=user_id, game_id=game.survival_game_id)

    if not word_ids:
        raise ValueError("No game questions cached for this game.")

    allowed = set(word_ids)
    by_id = {w.id: w for w in Word.objects.filter(is_deleted=False, id__in=allowed)}

    for a in answers:
        try:
            q_word_id = int(a.get("word_id"))
            selected_word_id = int(a.get("selected_word_id"))
        except (TypeError, ValueError):
            continue

        if q_word_id not in allowed:
            continue

        w = by_id.get(q_word_id)
        if not w:
            continue

        if selected_word_id == w.id:
            correct_count += 1

    game.score = correct_count  # Set the final score
    game.save(update_fields=["score", "updated_at"])  # Save the score

    return correct_count


# team1/services/answer_service.py

def set_active_question(user_id, game_id, word_id):
    """Stores the currently active question ID for validation."""
    cache_key = f"active_q:{user_id}:{game_id}"
    cache.set(cache_key, word_id, timeout=300)  # 5-minute window to answer


def get_active_question(user_id, game_id):
    return cache.get(f"active_q:{user_id}:{game_id}")


def validate_and_grade_single_answer(game, user_id, selected_word_id):
    active_word_id = get_active_question(user_id, game.survival_game_id)

    if not active_word_id:
        raise ValueError("No active question found or time expired.")

    is_correct = int(selected_word_id) == int(active_word_id)

    if is_correct:
        game.score += 1
    else:
        game.lives -= 1

    game.save(update_fields=["score", "lives", "updated_at"])

    # Clear active question so they can't answer the same one twice
    cache.delete(f"active_q:{user_id}:{game.survival_game_id}")

    return is_correct, active_word_id
