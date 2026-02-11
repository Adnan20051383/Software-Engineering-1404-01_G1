from django.db.models import Q

from team1.models import Word


def get_all_words_queryset(search_query=None, exact=False):
    words = Word.objects.filter(is_deleted=False)

    if search_query:
        if exact:
            words = words.filter(
                Q(english__iexact=search_query) | Q(persian__iexact=search_query)
            )
        else:
            # Partial match - Slower
            words = words.filter(
                Q(english__icontains=search_query) | Q(persian__icontains=search_query)
            )

    return words.order_by('-created_at')