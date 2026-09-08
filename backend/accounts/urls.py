from django.urls import path

from .views import LoginView, LogoutView, MeView, SignupView

urlpatterns = [
    # 회원가입 API
    path("auth/signup/", SignupView.as_view()),

    # 로그인 API
    path("auth/login/", LoginView.as_view()),

    # 로그아웃 API
    path("auth/logout/", LogoutView.as_view()),

    # 현재 로그인한 사용자 정보 조회/수정 API
    path("users/me/", MeView.as_view()),
]