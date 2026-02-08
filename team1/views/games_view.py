from django.core.cache import cache
from django.utils.decorators import method_decorator
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from core.auth import api_login_required
from team1.models import SurvivalGame
from team1.pagination import CustomPagination
from team1.serializers import SurvivalGameSerializer
from team1.services.answer_service import cache_game_questions, grade_game_answers
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


class SurvivalGameQuestionsAPIView(APIView, CustomPagination):
    @method_decorator(api_login_required)
    def get(self, request, game_id):
        user = request.user

        game = get_survival_game_by_id(game_id, user.id)
        if not game:
            return Response({"detail": "Survival game not found."}, status=status.HTTP_404_NOT_FOUND)

        try:
            count = int(request.GET.get("count", 1))
        except (TypeError, ValueError):
            return Response({"detail": "Invalid count"}, status=status.HTTP_400_BAD_REQUEST)

        if count < 1:
            return Response({"detail": "Invalid count"}, status=status.HTTP_400_BAD_REQUEST)

        # ایجاد سوالات و صفحه‌بندی آنها
        key = _cache_key(user.id, game_id)
        used = cache.get(key) or []
        used_set = set(used)
        questions = build_game_questions(count=count, used_word_ids=used_set)

        page = self.paginate_queryset(questions, request, view=self)
        if page is not None:
            return self.get_paginated_response(page)

        used_set.update([q["word_id"] for q in questions])
        cache.set(key, list(used_set), timeout=60 * 60 * 6)
        cache_game_questions(
            user_id=user.id,
            game_id=game.survival_game_id,
            word_ids=list(used_set),
            ttl_seconds=60 * 60 * 6
        )

        return Response(
            {"game_id": game.survival_game_id, "count": len(questions), "questions": questions},
            status=status.HTTP_200_OK
        )


class SurvivalGameAnswerAPIView(APIView):
    @method_decorator(api_login_required)
    def post(self, request, game_id):
        user = request.user
        game = SurvivalGame.objects.filter(survival_game_id=game_id, user_id=user.id).first()

        if not game:
            return Response({"detail": "Survival game not found."}, status=status.HTTP_404_NOT_FOUND)

        answers = request.data.get("answers", [])
        if not isinstance(answers, list):
            return Response({"detail": "Invalid answers"}, status=status.HTTP_400_BAD_REQUEST)

        # Call the grade_game_answers function to calculate the score
        try:
            correct_count = grade_game_answers(game=game, user_id=user.id, answers=answers)
        except ValueError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        # Update the game score and lives
        lives = game.lives
        for answer in answers:
            if answer.get("correct_answer") != answer.get("answer"):
                lives -= 1
            if lives <= 0:
                lives = 0
                break

        game.lives = lives
        game.save(update_fields=["score", "lives", "updated_at"])

        return Response(
            {"game_id": game.survival_game_id, "score": game.score, "lives": lives},
            status=status.HTTP_200_OK
        )


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
        rank = get_user_survival_game_rank(user_id)

        if rank is None:
            return Response({"detail": "You are not in the top 5 ranking."}, status=status.HTTP_404_NOT_FOUND)

        return Response({"rank": rank}, status=status.HTTP_200_OK)
