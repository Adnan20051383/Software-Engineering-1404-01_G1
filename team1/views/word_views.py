from rest_framework.views import APIView
from ..services.word_service import get_all_words_queryset
from ..serializers import WordSerializer
from ..pagination import CustomPagination


class WordListAPIView(APIView):
    def get(self, request):
        words = get_all_words_queryset()
        paginator = CustomPagination()

        # Paginate the results
        paginated_queryset = paginator.paginate_queryset(words, request)
        serializer = WordSerializer(paginated_queryset, many=True)

        return paginator.get_paginated_response(serializer.data)