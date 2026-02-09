from django.utils.decorators import method_decorator
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.core.cache import cache
from core.auth import api_login_required
from ..models import UserWord, Word
from ..pagination import CustomPagination
from ..serializers import QuizSerializer
from ..services.answer_service import  grade_quiz_answers
from ..services.question_generator import build_quiz_questions_for_user, build_mcq_for_word
from ..services.quiz_service import update_quiz, get_user_quizzes, create_quiz, get_quiz_by_id, delete_quiz
import random


class QuizCreateAPIView(APIView):
    @method_decorator(api_login_required)
    def post(self, request):
        user_id = request.user.id
        quiz_type = request.data['type']
        count_user_word = UserWord.objects.filter(user_id=user_id).count()
        if quiz_type == 1 and count_user_word < 5:
            return Response({"detail": "You Do Not Enough User Word To Take That Quiz."}, status=status.HTTP_400_BAD_REQUEST)
        if quiz_type == 2 and count_user_word < 10:
            return Response({"detail": "You Do Not Enough User Word To Take That Quiz."}, status=status.HTTP_400_BAD_REQUEST)
        if quiz_type == 3 and count_user_word < 15:
            return Response({"detail": "You Do Not Enough User Word To Take That Quiz."}, status=status.HTTP_400_BAD_REQUEST)
        score = request.data['score']

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
        correct_answer = request.data.get('correct_answer', None)
        try:
            updated_quiz = update_quiz(quiz_id, user_id, score, correct_count=correct_answer)
            serializer = QuizSerializer(updated_quiz)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except ValueError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)


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


class QuizQuestionsAPIView(APIView):
    @method_decorator(api_login_required)
    def get(self, request, quiz_id):
        user = request.user
        quiz = get_quiz_by_id(quiz_id, user.id)
        if not quiz:
            return Response({"detail": "Quiz not found."}, status=404)

        # 1. Get history of used words from cache
        used_key = f"quiz_used_ids:{user.id}:{quiz_id}"
        used_ids = cache.get(used_key) or []

        # 2. Check if quiz is already finished
        if len(used_ids) >= quiz.question_count:
            return Response({"detail": "Quiz completed.", "finished": True}, status=200)

        # 3. Pick a new word from UserWord that hasn't been used yet
        available_words = UserWord.objects.filter(
            user_id=user.id, is_deleted=False
        ).exclude(word_id__in=used_ids)

        if not available_words.exists():
            return Response({"detail": "No more user words available."}, status=404)

        target_user_word = random.choice(list(available_words))
        word_obj = target_user_word.word

        # 4. Build MCQ
        question_data = build_mcq_for_word(word=word_obj)

        # Ensure we are popping an INTEGER id
        correct_id = question_data.pop("answer_word_id")
        if isinstance(correct_id, dict):  # Just in case build_mcq returns a dict
            correct_id = correct_id.get("word_id")

        question_data.pop("word_id", None)

        # 5. Store answer as a clean integer
        cache.set(f"active_quiz_q:{user.id}:{quiz_id}", int(correct_id), timeout=600)

        used_ids.append(int(correct_id))
        cache.set(used_key, used_ids, timeout=3600)

        return Response({
            "question": question_data,
            "current_number": len(used_ids),
            "total_questions": quiz.question_count
        })


class QuizAnswerAPIView(APIView):
    @method_decorator(api_login_required)
    def post(self, request, quiz_id):
        user = request.user
        quiz = get_quiz_by_id(quiz_id, user.id)

        raw_data = request.data.get("selected_word_id")
        if isinstance(raw_data, dict):
            selected_id = raw_data.get("selected_word_id") or raw_data.get("word_id") or raw_data.get("id")
        else:
            selected_id = raw_data

        cache_key = f"active_quiz_q:{user.id}:{quiz_id}"
        correct_id = cache.get(cache_key)

        if selected_id is None or correct_id is None:
            return Response({"detail": "The answer is not found."}, status=400)

        correct_word_text = ""
        try:
            word_obj = Word.objects.get(id=correct_id)
            correct_word_text = word_obj.persian
        except Word.DoesNotExist:
            correct_word_text = "Unknown"

        is_correct = int(selected_id) == int(correct_id)

        if is_correct:
            quiz.correct_count += 1
            if quiz.question_count > 0:
                quiz.score = int((quiz.correct_count / quiz.question_count) * 100)
            quiz.save()

        cache.delete(cache_key)

        return Response({
            "is_correct": is_correct,
            "correct_id": correct_id,
            "correct_answer_text": correct_word_text,
            "score": quiz.score,
            "correct_count": quiz.correct_count
        })