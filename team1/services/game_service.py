from django.db.models import Max
from django.utils import timezone

from core.models import User
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
    """
    Returns a list of dictionaries containing user details and their max score.
    """
    # 1. Get top 5 user_ids and their max scores
    top_games = (
        SurvivalGame.objects
        .values("user_id")
        .annotate(max_score=Max("score"))
        .order_by("-max_score")[:5]
    )

    # 2. Extract the list of UUIDs
    user_ids = [game['user_id'] for game in top_games]

    # 3. Fetch User details for these IDs in one query
    users = User.objects.filter(id__in=user_ids).values(
        'id', 'first_name', 'last_name', 'email'
    )

    # 4. Create a lookup dictionary for fast access: {uuid: user_data}
    user_map = {u['id']: u for u in users}

    # 5. Merge the data
    results = []
    for game in top_games:
        uid = game['user_id']
        user_info = user_map.get(uid, {})

        results.append({
            "user_id": uid,
            "max_score": game['max_score'],
            "first_name": user_info.get('first_name', ''),
            "last_name": user_info.get('last_name', ''),
            "email": user_info.get('email', '')
        })

    return results


def get_user_survival_game_rank(user_id):
    """
    Returns a tuple: (rank_integer, full_user_data_dict)
    or (None, None) if not in top 5.
    """
    all_top_users = get_top_survival_game_rankings()

    for index, data in enumerate(all_top_users):
        # Compare UUIDs (convert to str to be safe)
        if str(data["user_id"]) == str(user_id):
            return index + 1, data

    return None, None