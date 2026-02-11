import uuid
from django.db import models
from django.utils import timezone


class TimeStampedSoftDeleteModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(null=True, blank=True)
    is_deleted = models.BooleanField(default=False)

    class Meta:
        abstract = True

    def save(self, *args, **kwargs):
        if self.pk is not None:
            self.updated_at = timezone.now()
        super().save(*args, **kwargs)


class Category(TimeStampedSoftDeleteModel):
    id = models.BigAutoField(primary_key=True)
    name = models.CharField(max_length=255, unique=True, db_index=True)

    class Meta:
        db_table = "categories"

    def __str__(self):
        return self.name


class Word(TimeStampedSoftDeleteModel):
    id = models.BigAutoField(primary_key=True)
    english = models.TextField(db_index=True)
    persian = models.TextField()

    category = models.ForeignKey(
        Category,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="words",
        db_column="category_id",
    )

    class Meta:
        db_table = "words"

    def __str__(self):
        return self.english


class UserWord(TimeStampedSoftDeleteModel):
    user_word_id = models.BigAutoField(primary_key=True)
    description = models.TextField()

    # CHANGED: Use ImageField instead of CharField
    image = models.ImageField(upload_to='user_words/', null=True, blank=True)

    last_check_date = models.DateField(null=True, blank=True)

    word = models.ForeignKey(
        'Word', on_delete=models.CASCADE, db_column="word_id", related_name="user_words"
    )

    leitner_type = models.CharField(
        max_length=10,
        choices=[('new', 'New'), ('1day', '1 Day'), ('3days', '3 Days'), ('7days', '7 Days'), ('mastered', 'Mastered')],
        default='new'
    )
    user_id = models.UUIDField(db_index=True)

    class Meta:
        db_table = "user_words"
        indexes = [
            models.Index(fields=["word"]),
            models.Index(fields=["user_id"]),
        ]


class Quiz(TimeStampedSoftDeleteModel):
    quiz_id = models.BigAutoField(primary_key=True)
    user_id = models.UUIDField(db_index=True)
    score = models.IntegerField(null=True, blank=True)
    type = models.IntegerField(null=True, blank=True)
    date = models.DateField(null=True, blank=True)
    correct_count = models.IntegerField(null=True, blank=True)
    question_count = models.IntegerField(null=True, blank=True)

    class Meta:
        db_table = "quiz"
        indexes = [
            models.Index(fields=["user_id"]),
            models.Index(fields=["user_id", "date"]),
        ]


class SurvivalGame(TimeStampedSoftDeleteModel):
    survival_game_id = models.BigAutoField(primary_key=True)
    user_id = models.UUIDField(db_index=True)
    score = models.IntegerField(null=True, blank=True)
    lives = models.IntegerField(null=True, blank=True)
    date = models.DateField(null=True, blank=True)

    class Meta:
        db_table = "survival_game"
        indexes = [
            models.Index(fields=["user_id"]),
            models.Index(fields=["user_id", "date"]),
        ]
