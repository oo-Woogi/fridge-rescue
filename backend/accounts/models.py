from django.contrib.auth.base_user import AbstractBaseUser
from django.contrib.auth.hashers import make_password
from django.contrib.auth.models import BaseUserManager
from django.db import models

from config.db_fields import UnsignedBigAutoField
from config.ids import generate_id


class UserManager(BaseUserManager):
    use_in_migrations = True

    def create_user(self, email, nickname, password):
        if not email:
            raise ValueError("email is required")
        user = self.model(
            user_id=generate_id("usr"),
            email=self.normalize_email(email),
            nickname=nickname,
            password=make_password(password),
        )
        user.save(using=self._db)
        return user


class User(AbstractBaseUser):
    """DB설계서.md 3.1 users 테이블."""

    user_id = models.CharField(primary_key=True, max_length=30, editable=False)
    email = models.EmailField(max_length=255, unique=True, db_column="email")
    nickname = models.CharField(max_length=50)
    # AbstractBaseUser.password는 기본 max_length=128이므로 DB설계서(255)에 맞게 재정의
    password = models.CharField(max_length=255, db_column="password_hash")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    last_login = None  # DB설계서에 없는 컬럼이라 AbstractBaseUser 기본 필드를 제거

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["nickname"]

    objects = UserManager()

    class Meta:
        db_table = "users"

    def __str__(self):
        return self.email

    @property
    def is_authenticated(self):
        return True

    @property
    def is_anonymous(self):
        return False


class RefreshToken(models.Model):
    """DB설계서.md 3.5 refresh_tokens 테이블."""

    token_id = UnsignedBigAutoField(primary_key=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, db_column="user_id", related_name="refresh_tokens")
    token_hash = models.CharField(max_length=255, unique=True)
    expires_at = models.DateTimeField()
    revoked_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "refresh_tokens"
        indexes = [models.Index(fields=["user"], name="idx_refresh_user")]
