from django.db.models import Max
from django.utils import timezone

from team1.models import SurvivalGame


def create_survival_game(user_id, score, lives):
    # Create a new SurvivalGame entry for the user
    game = SurvivalGame.objects.create(
        user_id=user_id,
        score=score,
        lives=lives,
        date=timezone.now().date()
    )
    return game

def get_user_survival_games(user_id):
    # Get all survival games for a specific user
    return SurvivalGame.objects.filter(user_id=user_id)

def get_survival_game_by_id(game_id, user_id):
    # Get a specific survival game by game_id and user_id
    try:
        game = SurvivalGame.objects.get(survival_game_id=game_id, user_id=user_id)
        return game
    except SurvivalGame.DoesNotExist:
        return None

def update_survival_game(game_id, user_id, score=None, lives=None):
    # Update a specific survival game
    game = get_survival_game_by_id(game_id, user_id)
    if game:
        if score is not None:
            game.score = score
        if lives is not None:
            game.lives = lives
        game.save()
        return game
    return None


def delete_survival_game(game_id, user_id):
    try:
        game = SurvivalGame.objects.get(survival_game_id=game_id, user_id=user_id)
        game.delete()
    except SurvivalGame.DoesNotExist:
        raise ValueError("Survival game not found or you are not authorized to delete this game.")


def get_top_survival_game_rankings():
    # Getting the top 5 users based on highest score in survival game
    top_users = (
        SurvivalGame.objects
        .values("user_id")
        .annotate(max_score=Max("score"))
        .order_by("-max_score")[:5]
    )

    return top_users


def get_user_survival_game_rank(user_id):
    # Get the user's rank in the top 5 based on their highest score
    all_users = get_top_survival_game_rankings()

    for rank, user in enumerate(all_users, start=1):
        if user["user_id"] == user_id:
            return rank

    return None  # If the user is not in the top 5