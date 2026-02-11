from django.utils.decorators import method_decorator
from rest_framework.pagination import PageNumberPagination
from rest_framework.views import APIView

from core.auth import api_login_required
from ..services.word_service import get_all_words_queryset
from ..serializers import WordSerializer
from ..pagination import CustomPagination


class WordListAPIView(APIView):
    @method_decorator(api_login_required)
    def get(self, request):
        search_query = request.GET.get('search', '')
        exact = request.GET.get('exact', 'false').lower() == 'true'

        words = get_all_words_queryset(search_query, exact=exact)

        paginator = CustomPagination()
        paginator.page_size = 100  # Set page size to 100

        paginated_queryset = paginator.paginate_queryset(words, request)
        serializer = WordSerializer(paginated_queryset, many=True)

        return paginator.get_paginated_response(serializer.data)