from django.http import JsonResponse
from django.shortcuts import render, redirect
from core.auth import api_login_required

TEAM_NAME = "team1"


@api_login_required
def ping(request):
    return JsonResponse({"team": TEAM_NAME, "ok": True})


def base(request):
    return render(request, f"{TEAM_NAME}/index.html")


@api_login_required
def team_redirect(request, rest):
    target_url = f"http://localhost:9101/{rest}"
    return redirect(target_url)
