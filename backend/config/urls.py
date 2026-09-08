"""API명세서.md 1.2절 Base URL: https://api.fridge-rescue.app/v1 (로컬 개발: /v1/...)."""

from django.urls import include, path

urlpatterns = [
    path("v1/", include("accounts.urls")),
    path("v1/", include("foods.urls")),
    path("v1/", include("notifications.urls")),
    path("v1/", include("stats.urls")),
    path("v1/", include("content.urls")),
]
