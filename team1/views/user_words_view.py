from django.utils.decorators import method_decorator
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from core.auth import api_login_required
from ..serializers import UserWordSerializer
from ..services.user_words_service import create_user_word, search_user_words, get_user_words_by_leitner, \
    delete_user_word, edit_user_word, get_user_word_by_id
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser


class UserWordSearchAPIView(APIView):
    method_decorator(api_login_required)

    def get(self, request):
        user_id = request.user.id
        search_term = request.GET.get('search', '')
        user_words = search_user_words(user_id, search_term)
        serializer = UserWordSerializer(user_words, many=True)
        return Response(serializer.data)


class UserWordListByLeitnerAPIView(APIView):
    @method_decorator(api_login_required)

    def get(self, request, leitner_type):
        user_id = request.user.id
        user_words = get_user_words_by_leitner(user_id, leitner_type)
        serializer = UserWordSerializer(user_words, many=True)
        return Response(serializer.data)


class UserWordCreateAPIView(APIView):

    # Allow parsing of file uploads

    parser_classes = (MultiPartParser, FormParser, JSONParser)

    @method_decorator(api_login_required)
    def post(self, request):
        user_id = request.user.id
        word_id = request.data.get('word_id')
        description = request.data.get('description', '')
        # Get the file from FILES, fallback to None
        image = request.FILES.get('image', None)

        try:
            user_word = create_user_word(user_id, word_id, description, image)
            serializer = UserWordSerializer(user_word)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except ValueError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class UserWordEditAPIView(APIView):

    parser_classes = (MultiPartParser, FormParser, JSONParser)

    @method_decorator(api_login_required)
    def patch(self, request, user_word_id):
        description = request.data.get('description', '')
        image = request.FILES.get('image', None)

        # In multipart/form-data, booleans often come as strings like "true"/"false"
        move_to_next = request.data.get('move_to_next_box', 'false')
        move_to_next_box = str(move_to_next).lower() == 'true'

        reset = request.data.get('reset_to_day_1', 'false')
        reset_to_day_1 = str(reset).lower() == 'true'

        try:
            user_word = edit_user_word(user_word_id, description, image, move_to_next_box, reset_to_day_1)
            serializer = UserWordSerializer(user_word)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except ValueError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class UserWordGetByIdAPIView(APIView):
    @method_decorator(api_login_required)
    def get(self, request, user_word_id):
        user_id = request.user.id
        try:
            user_word = get_user_word_by_id(user_word_id, user_id)
            serializer = UserWordSerializer(user_word)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except ValueError as e:
            return Response({"detail": str(e)}, status=status.HTTP_404_NOT_FOUND)


class UserWordDeleteAPIView(APIView):
    @method_decorator(api_login_required)

    def delete(self, request, user_word_id):
        try:
            delete_user_word(user_word_id)
            return Response({"detail": "UserWord deleted successfully."}, status=status.HTTP_204_NO_CONTENT)
        except ValueError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
