from django.urls import path


from .views.dashboard_view import DashboardStatsAPIView
from .views.games_view import SurvivalGameCreateAPIView, SurvivalGameListAPIView, SurvivalGameDetailAPIView, \
    SurvivalGameQuestionsAPIView, SurvivalGameAnswerAPIView, SurvivalGameDeleteAPIView, TopSurvivalGameRankingAPIView, \
    UserSurvivalGameRankingAPIView
from .views.quiz_view import QuizCreateAPIView, QuizListAPIView, QuizUpdateAPIView, QuizQuestionsAPIView, \
    QuizAnswerAPIView, QuizDeleteAPIView
from .views.user_words_view import UserWordCreateAPIView, UserWordSearchAPIView, UserWordListByLeitnerAPIView, \
    UserWordDeleteAPIView, UserWordEditAPIView, UserWordGetByIdAPIView
from .views.word_views import WordListAPIView
from .views.redirect_views import team_redirect
from django.conf import settings
from django.conf.urls.static import static


urlpatterns = [
    # =======================      UserWords     =======================
    path("words/", WordListAPIView.as_view(), name="word-list"),

    # =======================      UserWords     =======================
    path('userwords/', UserWordCreateAPIView.as_view(), name='userword-create'),
    path('userwords/search/', UserWordSearchAPIView.as_view(), name='userword-search'),
    path('userwords/leitner/<str:leitner_type>/', UserWordListByLeitnerAPIView.as_view(), name='userword-list-by-leitner'),
    path('userwords/<int:user_word_id>/delete/', UserWordDeleteAPIView.as_view(), name='userword-delete'),
    path('userwords/<int:user_word_id>/edit/', UserWordEditAPIView.as_view(), name='userword-edit'),
    path('userwords/<int:user_word_id>/', UserWordGetByIdAPIView.as_view(), name='userword-get-by-id'),

    # =======================      Quiz     =======================
    path("quizzes/", QuizListAPIView.as_view(), name="quiz-list"),
    path("quizzes/create/", QuizCreateAPIView.as_view(), name="quiz-create"),
    path("quizzes/<int:quiz_id>/", QuizUpdateAPIView.as_view(), name="quiz-update"),
    path("quizzes/<int:quiz_id>/questions/", QuizQuestionsAPIView.as_view(), name="quiz-questions"),
    path('quizzes/<int:quiz_id>/answers/', QuizAnswerAPIView.as_view(), name='quiz-answer'),
    path('quizzes/<int:quiz_id>/', QuizDeleteAPIView.as_view(), name='quiz-delete'),

    # =======================      Game     =======================
    path("survival_games/", SurvivalGameListAPIView.as_view(), name="survival-game-list"),
    path("survival_games/create/", SurvivalGameCreateAPIView.as_view(), name="survival-game-create"),
    path("survival_games/<int:game_id>/", SurvivalGameDetailAPIView.as_view(), name="survival-game-detail"),
    path("survival_games/<int:game_id>/questions/", SurvivalGameQuestionsAPIView.as_view(), name="survival-game-questions"),
    path('survival_games/<int:game_id>/answers/', SurvivalGameAnswerAPIView.as_view(), name='game-answer'),
    path('survival_games/<int:game_id>/', SurvivalGameDeleteAPIView.as_view(), name='survival-game-delete'),
    path("survival_games/ranking/", TopSurvivalGameRankingAPIView.as_view(), name="survival-game-ranking"),
    path("survival_games/ranking/user/", UserSurvivalGameRankingAPIView.as_view(), name="user-survival-game-ranking"),

    # =======================      Statistics     =======================
    path("dashboard/stats/", DashboardStatsAPIView.as_view(), name="dashboard-stats"),

    # =======================      Redirects     =======================
    path("<path:rest>", team_redirect),
    path("", team_redirect, {'rest': ''}),

]
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
