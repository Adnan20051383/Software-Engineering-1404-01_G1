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


class Leitner(TimeStampedSoftDeleteModel):
    class BoxType(models.TextChoices):
        NEW = "new", "New"
        DAY_1 = "1_day", "1 Day"
        DAYS_3 = "3_days", "3 Days"
        DAYS_7 = "7_days", "7 Days"
        MASTERED = "mastered", "Mastered"

    leitner_id = models.BigAutoField(primary_key=True)

    user_id = models.UUIDField(db_index=True)
    type = models.CharField(max_length=20, choices=BoxType.choices, default=BoxType.NEW)

    class Meta:
        db_table = "leitner"
        indexes = [
            models.Index(fields=["user_id"]),
            models.Index(fields=["user_id", "type"]),
        ]

    def __str__(self):
        return f"{self.user_id}:{self.type}"


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
    image_url = models.CharField(max_length=255, null=True, blank=True)
    last_check_date = models.DateField(null=True, blank=True)

    word = models.ForeignKey(Word, on_delete=models.CASCADE, db_column="word_id", related_name="user_words")
    leitner = models.ForeignKey(Leitner, on_delete=models.CASCADE, db_column="leitner_id", related_name="user_words")
    user_id = models.UUIDField(db_index=True)

    class Meta:
        db_table = "user_words"
        indexes = [
            models.Index(fields=["word"]),
            models.Index(fields=["leitner"]),
            models.Index(fields=["user_id"]),
        ]


class Question(TimeStampedSoftDeleteModel):
    question_id = models.BigAutoField(primary_key=True)

    answer = models.CharField(max_length=255)
    difficulty = models.IntegerField()

    optiona = models.CharField(max_length=255, null=True, blank=True)
    optionb = models.CharField(max_length=255, null=True, blank=True)
    optionc = models.CharField(max_length=255, null=True, blank=True)
    optiond = models.CharField(max_length=255, null=True, blank=True)

    word = models.ForeignKey(Word, on_delete=models.CASCADE, db_column="word_id", related_name="questions")

    class Meta:
        db_table = "question"
        indexes = [models.Index(fields=["word"])]


class Quiz(TimeStampedSoftDeleteModel):
    quiz_id = models.BigAutoField(primary_key=True)

    user_id = models.UUIDField(db_index=True)
    score = models.IntegerField(null=True, blank=True)
    type = models.IntegerField(null=True, blank=True)
    date = models.DateField(null=True, blank=True)

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


class UserAnswer(TimeStampedSoftDeleteModel):
    user_answer_id = models.BigAutoField(primary_key=True)

    user_id = models.UUIDField(db_index=True)
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, db_column="quiz_id", related_name="answers")
    question = models.ForeignKey(Question, on_delete=models.CASCADE, db_column="question_id", related_name="user_answers")
    answer = models.CharField(max_length=255, null=True, blank=True)

    class Meta:
        db_table = "user_answer"
        indexes = [
            models.Index(fields=["user_id"]),
            models.Index(fields=["quiz"]),
            models.Index(fields=["question"]),
            models.Index(fields=["user_id", "quiz", "question"]),
        ]
