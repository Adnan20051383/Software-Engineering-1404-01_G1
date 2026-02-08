from django.utils.decorators import method_decorator
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from core.auth import api_login_required
from team1.services.dashboard_service import get_user_dashboard_stats


class DashboardStatsAPIView(APIView):
    @method_decorator(api_login_required)
    def get(self, request):
        stats = get_user_dashboard_stats(user_id=request.user.id)
        return Response(stats, status=status.HTTP_200_OK)
