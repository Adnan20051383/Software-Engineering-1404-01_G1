from django.utils.decorators import method_decorator
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from core.auth import api_login_required
from ..pagination import CustomPagination
from ..serializers import QuizSerializer
from ..services.answer_service import  grade_quiz_answers
from ..services.question_generator import build_quiz_questions_for_user
from ..services.quiz_service import update_quiz, get_user_quizzes, create_quiz, get_quiz_by_id, delete_quiz


class QuizCreateAPIView(APIView):
    @method_decorator(api_login_required)
    def post(self, request):
        user_id = request.user.id
        score = request.data['score']
        quiz_type = request.data['type']

        try:
            quiz = create_quiz(user_id, score, quiz_type)
            serializer = QuizSerializer(quiz)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except ValueError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class QuizListAPIView(APIView):
    @method_decorator(api_login_required)
    def get(self, request):
        user_id = request.user.id
        start_date = request.GET.get('start_date', None)
        end_date = request.GET.get('end_date', None)

        quizzes = get_user_quizzes(user_id, start_date, end_date)
        serializer = QuizSerializer(quizzes, many=True)
        return Response(serializer.data)


class QuizUpdateAPIView(APIView):
    @method_decorator(api_login_required)
    def get(self, request, quiz_id):
        user_id = request.user.id
        quiz = get_quiz_by_id(quiz_id, user_id)

        if not quiz:
            return Response({"detail": "Quiz not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = QuizSerializer(quiz)
        return Response(serializer.data)

    @method_decorator(api_login_required)
    def patch(self, request, quiz_id):
        user_id = request.user.id
        score = request.data.get('score', None)
        quiz_type = request.data.get('type', None)

        try:
            updated_quiz = update_quiz(quiz_id, user_id, score, quiz_type)
            serializer = QuizSerializer(updated_quiz)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except ValueError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class QuizQuestionsAPIView(APIView, CustomPagination):
    @method_decorator(api_login_required)
    def get(self, request, quiz_id):
        user = request.user
        quiz = get_quiz_by_id(quiz_id, user.id)
        if not quiz:
            return Response({"detail": "Quiz not found."}, status=status.HTTP_404_NOT_FOUND)

        try:
            count = int(request.GET.get("count", 10))
        except (TypeError, ValueError):
            return Response({"detail": "Invalid count"}, status=status.HTTP_400_BAD_REQUEST)

        if count < 1:
            return Response({"detail": "Invalid count"}, status=status.HTTP_400_BAD_REQUEST)

        # ایجاد سوالات و صفحه‌بندی آنها
        questions = build_quiz_questions_for_user(user_id=user.id, count=count)
        page = self.paginate_queryset(questions, request, view=self)
        if page is not None:
            return self.get_paginated_response(page)
        return Response({"quiz_id": quiz.quiz_id, "count": len(questions), "questions": questions}, status=status.HTTP_200_OK)


class QuizAnswerAPIView(APIView):
    @method_decorator(api_login_required)
    def post(self, request, quiz_id):
        user = request.user
        quiz = get_quiz_by_id(quiz_id, user.id)
        if not quiz:
            return Response({"detail": "Quiz not found."}, status=status.HTTP_404_NOT_FOUND)

        answers = request.data.get("answers", [])
        if not isinstance(answers, list):
            return Response({"detail": "Invalid answers"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            correct, total, score_100 = grade_quiz_answers(quiz=quiz, user_id=user.id, answers=answers)
        except ValueError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(
            {"quiz_id": quiz.quiz_id, "correct": correct, "total": total, "score": score_100},
            status=status.HTTP_200_OK
        )


class QuizDeleteAPIView(APIView):
    @method_decorator(api_login_required)
    def delete(self, request, quiz_id):
        user_id = request.user.id
        quiz = get_quiz_by_id(quiz_id, user_id)
        if not quiz:
            return Response({"detail": "Quiz not found."}, status=status.HTTP_404_NOT_FOUND)

        try:
            delete_quiz(quiz_id, user_id)
            return Response({"detail": "Quiz deleted successfully."}, status=status.HTTP_204_NO_CONTENT)
        except ValueError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)