from rest_framework import serializers
from .models import Word, UserWord, Quiz, SurvivalGame, Category
from .services.user_words_service import is_due


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'created_at', 'updated_at']


class WordSerializer(serializers.ModelSerializer):
    category = CategorySerializer()  # Nested CategorySerializer

    class Meta:
        model = Word
        fields = ['id', 'english', 'persian', 'category', 'created_at', 'updated_at']


class UserWordSerializer(serializers.ModelSerializer):
    is_due = serializers.SerializerMethodField()
    word = WordSerializer()

    class Meta:
        model = UserWord
        fields = ['user_word_id', 'word', 'description', 'image', 'leitner_type', 'last_check_date', 'is_due']

    def get_is_due(self, obj):
        return is_due(obj)  # Call the function to check if the word is due


class QuizSerializer(serializers.ModelSerializer):
    class Meta:
        model = Quiz
        fields = ["quiz_id", "user_id", "type", "date", "score", "correct_count", "question_count", "created_at", "updated_at"]


class SurvivalGameSerializer(serializers.ModelSerializer):
    class Meta:
        model = SurvivalGame
        fields = ['survival_game_id', 'user_id', 'score', 'lives', 'date']

