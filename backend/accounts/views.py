import hashlib

from django.utils import timezone
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import AccessToken

from config.responses import ok
from config.settings import (
    JWT_REFRESH_TOKEN_LIFETIME_DEFAULT,
    JWT_REFRESH_TOKEN_LIFETIME_REMEMBER_ME,
)

from .models import RefreshToken, User
from .serializers import LoginSerializer, SignupSerializer, UpdateMeSerializer, UserSerializer


def _issue_tokens(user, remember_me):
    """API명세서.md에는 access/refresh 이원화 없이 로그인 응답에 단일 token만 존재하므로,
    "로그인 상태 유지"(remember_me) 여부에 따라 이 토큰 자체의 만료 기간을 길게/짧게 발급한다."""
    lifetime = JWT_REFRESH_TOKEN_LIFETIME_REMEMBER_ME if remember_me else JWT_REFRESH_TOKEN_LIFETIME_DEFAULT
    token = AccessToken.for_user(user)
    token.set_exp(lifetime=lifetime)
    token_str = str(token)

    RefreshToken.objects.create(
        user=user,
        token_hash=hashlib.sha256(token_str.encode()).hexdigest(),
        expires_at=timezone.now() + lifetime,
    )
    return token_str, int(lifetime.total_seconds())


class SignupView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = SignupSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        access_token, expires_in = _issue_tokens(user, remember_me=False)
        return ok(
            {
                "user": UserSerializer(user).data,
                "token": access_token,
            },
            status=201,
        )


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]
        remember_me = serializer.validated_data["remember_me"]
        access_token, expires_in = _issue_tokens(user, remember_me)
        return ok(
            {
                "user": {
                    "user_id": user.user_id,
                    "nickname": user.nickname,
                    "email": user.email,
                },
                "token": access_token,
                "expires_in": expires_in,
            }
        )


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        RefreshToken.objects.filter(user=request.user, revoked_at__isnull=True).update(revoked_at=timezone.now())
        return Response(status=204)


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return ok(UserSerializer(request.user).data)

    def patch(self, request):
        serializer = UpdateMeSerializer(data=request.data, context={"user": request.user})
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return ok(UserSerializer(user).data)
