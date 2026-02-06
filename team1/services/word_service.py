from team1.models import Word


def get_all_words_queryset():
    """Returns a queryset of all non-deleted words."""
    return Word.objects.filter(is_deleted=False).order_by('-created_at')
