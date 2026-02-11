from django.utils import timezone
from team1.models import Word, UserWord
from datetime import timedelta


def search_user_words(user_id, search_term):
    return UserWord.objects.filter(user_id=user_id, word__english__icontains=search_term, word__persian__icontains=search_term)


def get_user_words_by_leitner(user_id, leitner_type):
    return UserWord.objects.filter(user_id=user_id, leitner_type=leitner_type)


def create_user_word(user_id, word_id, description, image=None):
    try:
        word = Word.objects.get(id=word_id)
    except Word.DoesNotExist:
        raise ValueError("Word does not exist in the database.")

    if UserWord.objects.filter(user_id=user_id, word=word).exists():
        raise ValueError("This word is already added by the user.")

    user_word = UserWord.objects.create(
        word=word,
        user_id=user_id,
        description=description,
        image=image,  # Pass the file object here
        leitner_type='new'
    )
    return user_word


def edit_user_word(user_word_id, description, image=None, move_to_next_box=False, reset_to_day_1=False):
    try:
        user_word = UserWord.objects.get(user_word_id=user_word_id)
    except UserWord.DoesNotExist:
        raise ValueError("UserWord not found.")

    user_word.description = description

    # Only update image if a new file is provided
    if image:
        user_word.image = image

    if move_to_next_box or reset_to_day_1:
        user_word.last_check_date = timezone.now().date()

    if move_to_next_box:
        user_word.leitner_type = get_next_leitner_box(user_word.leitner_type)
    elif reset_to_day_1:
        user_word.leitner_type = '1day'

    user_word.save()
    user_word.refresh_from_db()

    return user_word

def get_next_leitner_box(current_box):
    box_order = ['new', '1day', '3days', '7days', 'mastered']
    if current_box in box_order and box_order.index(current_box) + 1 < len(box_order):
        return box_order[box_order.index(current_box) + 1]
    return 'mastered'  # If it's 'mastered', it stays 'mastered'


def get_user_word_by_id(user_word_id, user_id):
    try:
        user_word = UserWord.objects.get(id=user_word_id, user_id=user_id)
        return user_word
    except UserWord.DoesNotExist:
        raise ValueError("UserWord not found or not authorized.")


def delete_user_word(user_word_id):
    try:
        user_word = UserWord.objects.get(user_word_id=user_word_id)
        user_word.delete()
    except UserWord.DoesNotExist:
        raise ValueError("UserWord not found.")


# Define the intervals for different leitner types
INTERVAL_DAYS = {
    'new': 1,        # New words are due every day
    '1day': 1,       # Words in the 1 day box are reviewed every 1 day
    '3days': 3,      # Words in the 3 days box are reviewed every 3 days
    '7days': 7,      # Words in the 7 days box are reviewed every 7 days
    'mastered': None # Mastered words are never due for review
}


def is_due(user_word):
    """Check if the word is due based on its leitner_type and last_check_date."""
    if user_word.leitner_type == 'mastered':
        return True  # Mastered words are always due

    # If no last check date, it's due right now
    if not user_word.last_check_date:
        return True

    # Get the interval for the given leitner type
    days = INTERVAL_DAYS.get(user_word.leitner_type, 0)
    if days is None:
        return False

    due_date = user_word.last_check_date + timedelta(days=days)
    return timezone.now().date() >= due_date  # Check if current date is past the due date
