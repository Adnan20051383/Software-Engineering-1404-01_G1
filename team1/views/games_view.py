from django.core.cache import cache
from django.utils.decorators import method_decorator
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from core.auth import api_login_required
from team1.models import SurvivalGame, Word
from team1.pagination import CustomPagination
from team1.serializers import SurvivalGameSerializer
from team1.services.answer_service import cache_game_questions, grade_game_answers, set_active_question, \
    validate_and_grade_single_answer
from team1.services.game_service import create_survival_game, get_user_survival_games, get_survival_game_by_id, \
    update_survival_game, delete_survival_game, get_user_survival_game_rank, get_top_survival_game_rankings
from team1.services.question_generator import build_game_questions


class SurvivalGameCreateAPIView(APIView):
    @method_decorator(api_login_required)
    def post(self, request):
        user_id = request.user.id
        score = request.data['score']
        lives = request.data['lives']

        # Create the survival game
        game = create_survival_game(user_id, score, lives)
        serializer = SurvivalGameSerializer(game)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class SurvivalGameListAPIView(APIView):
    @method_decorator(api_login_required)
    def get(self, request):
        user_id = request.user.id
        games = get_user_survival_games(user_id)
        serializer = SurvivalGameSerializer(games, many=True)
        return Response(serializer.data)


class SurvivalGameDetailAPIView(APIView):
    @method_decorator(api_login_required)
    def get(self, request, game_id):
        user_id = request.user.id
        game = get_survival_game_by_id(game_id, user_id)

        if not game:
            return Response({"detail": "Survival game not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = SurvivalGameSerializer(game)
        return Response(serializer.data)

    @method_decorator(api_login_required)
    def patch(self, request, game_id):
        user_id = request.user.id
        score = request.data.get('score', None)
        lives = request.data.get('lives', None)

        game = update_survival_game(game_id, user_id, score, lives)

        if not game:
            return Response({"detail": "Survival game not found or unauthorized."}, status=status.HTTP_404_NOT_FOUND)

        serializer = SurvivalGameSerializer(game)
        return Response(serializer.data)


def _cache_key(user_id, game_id):
    return f"team1:game_used_words:{user_id}:{game_id}"


class SurvivalGameDeleteAPIView(APIView):
    @method_decorator(api_login_required)
    def delete(self, request, game_id):
        user_id = request.user.id
        game = get_survival_game_by_id(game_id, user_id)
        if not game:
            return Response({"detail": "Survival game not found."}, status=status.HTTP_404_NOT_FOUND)

        try:
            delete_survival_game(game_id, user_id)
            return Response({"detail": "Survival game deleted successfully."}, status=status.HTTP_204_NO_CONTENT)
        except ValueError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class TopSurvivalGameRankingAPIView(APIView):
    @method_decorator(api_login_required)
    def get(self, request):
        top_users = get_top_survival_game_rankings()
        return Response(top_users, status=status.HTTP_200_OK)


class UserSurvivalGameRankingAPIView(APIView):
    @method_decorator(api_login_required)
    def get(self, request):
        user_id = request.user.id

        rank, user_data = get_user_survival_game_rank(user_id)

        if rank is None:
            return Response(
                {"detail": "You are not in the top 5 ranking."},
                status=status.HTTP_404_NOT_FOUND
            )

        response_data = {
            "rank": rank,
            **user_data
        }

        return Response(response_data, status=status.HTTP_200_OK)


class SurvivalGameQuestionsAPIView(APIView):
    @method_decorator(api_login_required)
    def get(self, request, game_id):
        user = request.user
        game = get_survival_game_by_id(game_id, user.id)
        if not game:
            return Response({"detail": "Game not found."}, status=status.HTTP_404_NOT_FOUND)

        # Get exactly ONE question
        key = f"team1:game_used_words:{user.id}:{game_id}"
        used = cache.get(key) or []

        # We only need 1 question at a time now
        question_list = build_game_questions(count=1, used_word_ids=set(used))
        if not question_list:
            return Response({"detail": "No more questions available."}, status=404)

        question_data = question_list[0]

        # --- ANTI-CHEAT LOGIC ---
        # 1. Remove the answer IDs from the dictionary so they aren't in the JSON
        correct_answer_id = question_data.pop("answer_word_id")
        question_data.pop("word_id")  # Remove the other ID shown in your screenshot

        # 2. Save the correct ID in the CACHE where the user can't see it
        # This makes this specific ID the "Active Question" for this game
        cache.set(f"active_q:{user.id}:{game_id}", correct_answer_id, timeout=300)

        # 3. Update used words
        used.append(correct_answer_id)
        cache.set(key, used, timeout=60 * 60)
        # -------------------------

        return Response(question_data)  # This now only contains 'prompt' and 'options'


class SurvivalGameAnswerAPIView(APIView):
    @method_decorator(api_login_required)
    def post(self, request, game_id):
        user = request.user
        game = SurvivalGame.objects.filter(survival_game_id=game_id, user_id=user.id).first()
        selected_id = request.data.get("selected_word_id")
        correct_id = cache.get(f"active_q:{user.id}:{game_id}")

        if correct_id is None:
            return Response({"detail": "No active question found."}, status=400)

        is_correct = int(selected_id) == int(correct_id)

        correct_word_obj = Word.objects.filter(id=correct_id).first()
        correct_text = correct_word_obj.persian if correct_word_obj else ""

        if is_correct:
            game.score += 1
        else:
            game.lives -= 1

        game.save(update_fields=["score", "lives", "updated_at"])
        cache.delete(f"active_q:{user.id}:{game_id}")

        return Response({
            "is_correct": is_correct,
            "correct_word_id": correct_id,
            "correct_answer_text": correct_text,  # <--- NEW FIELD
            "score": game.score,
            "lives": game.lives,
            "game_over": game.lives <= 0
        })