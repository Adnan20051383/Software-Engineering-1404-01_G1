from django.db.models import Q

from team1.models import Word


def get_all_words_queryset(search_query=None):
    """Returns a queryset of all non-deleted words, with optional search filtering"""
    words = Word.objects.filter(is_deleted=False)

    if search_query:
        words = words.filter(
            Q(english__icontains=search_query) | Q(persian__icontains=search_query)
        )

    return words.order_by('-created_at')