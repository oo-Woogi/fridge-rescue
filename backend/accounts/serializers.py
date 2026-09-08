import re

from django.contrib.auth import authenticate
from django.contrib.auth.hashers import check_password, make_password
from rest_framework import serializers

from config.exceptions import AppError

from .models import User

PASSWORD_RE = re.compile(r"^(?=.*[A-Za-z])(?=.*\d).{8,}$")


def validate_password_policy(password):
    if not PASSWORD_RE.match(password):
        raise AppError(
            "PASSWORD_POLICY_VIOLATION",
            "비밀번호는 영문, 숫자를 포함하여 8자 이상이어야 합니다.",
            status_code=422,
        )


class SignupSerializer(serializers.Serializer):
    nickname = serializers.CharField(min_length=1, max_length=50)
    email = serializers.EmailField(max_length=255)
    password = serializers.CharField(write_only=True)
    password_confirm = serializers.CharField(write_only=True)

    def validate_email(self, value):
        value = value.lower()
        if User.objects.filter(email=value).exists():
            raise AppError("EMAIL_ALREADY_EXISTS", "이미 가입된 이메일입니다.", status_code=409)
        return value

    def validate(self, attrs):
        validate_password_policy(attrs["password"])
        if attrs["password"] != attrs["password_confirm"]:
            raise AppError(
                "PASSWORD_CONFIRM_MISMATCH",
                "비밀번호와 비밀번호 확인이 일치하지 않습니다.",
                status_code=422,
            )
        return attrs

    def create(self, validated_data):
        return User.objects.create_user(
            email=validated_data["email"],
            nickname=validated_data["nickname"],
            password=validated_data["password"],
        )


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    remember_me = serializers.BooleanField(default=False)

    def validate(self, attrs):
        try:
            user = User.objects.get(email=attrs["email"].lower())
        except User.DoesNotExist:
            raise AppError("INVALID_CREDENTIALS", "이메일 또는 비밀번호가 올바르지 않습니다.", status_code=401)
        if not check_password(attrs["password"], user.password):
            raise AppError("INVALID_CREDENTIALS", "이메일 또는 비밀번호가 올바르지 않습니다.", status_code=401)
        attrs["user"] = user
        return attrs


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["user_id", "email", "nickname", "created_at", "updated_at"]


class UpdateMeSerializer(serializers.Serializer):
    """계정 설정(SCR-SETTINGS-PROFILE): 닉네임 변경과 비밀번호 변경을 하나의 엔드포인트로 처리."""

    nickname = serializers.CharField(min_length=1, max_length=50, required=False)
    current_password = serializers.CharField(write_only=True, required=False)
    new_password = serializers.CharField(write_only=True, required=False)
    new_password_confirm = serializers.CharField(write_only=True, required=False)

    def validate(self, attrs):
        user = self.context["user"]
        wants_password_change = any(
            attrs.get(f) for f in ("current_password", "new_password", "new_password_confirm")
        )
        if wants_password_change:
            if not attrs.get("current_password"):
                raise AppError(
                    "CURRENT_PASSWORD_REQUIRED",
                    "현재 비밀번호를 입력해주세요.",
                    status_code=400,
                )
            if not check_password(attrs["current_password"], user.password):
                raise AppError(
                    "CURRENT_PASSWORD_MISMATCH",
                    "현재 비밀번호가 일치하지 않습니다.",
                    status_code=401,
                )
            validate_password_policy(attrs.get("new_password", ""))
            if attrs.get("new_password") != attrs.get("new_password_confirm"):
                raise AppError(
                    "PASSWORD_CONFIRM_MISMATCH",
                    "새 비밀번호와 확인값이 일치하지 않습니다.",
                    status_code=422,
                )
        return attrs

    def save(self):
        user = self.context["user"]
        if "nickname" in self.validated_data:
            user.nickname = self.validated_data["nickname"]
        if self.validated_data.get("new_password"):
            user.password = make_password(self.validated_data["new_password"])
        user.save()
        return user
