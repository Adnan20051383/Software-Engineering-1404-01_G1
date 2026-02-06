from django.urls import path
from .views.word_views import WordListAPIView
from .views.redirect_views import team_redirect

urlpatterns = [
    path("words/", WordListAPIView.as_view(), name="word-list"),

    path("<path:rest>", team_redirect),
    path("", team_redirect, {'rest': ''}),
]
