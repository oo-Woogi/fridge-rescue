"""
Django settings for config project (냉장고 구조대 / Fridge Rescue backend).

스택: Django + Django REST Framework + MySQL + Celery/Celery Beat + Redis + Firebase(FCM)
(시스템.png "시스템 구성도 v1.0" 기준)
"""

import os
from datetime import timedelta
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

SECRET_KEY = os.environ.get("SECRET_KEY", "insecure-dev-key")
DEBUG = os.environ.get("DEBUG", "True") == "True"
ALLOWED_HOSTS = os.environ.get("ALLOWED_HOSTS", "localhost,127.0.0.1").split(",")

INSTALLED_APPS = [
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.staticfiles",
    "rest_framework",
    "corsheaders",
    "django_celery_beat",
    "accounts",
    "foods",
    "notifications",
    "stats",
    "content",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"

# ---- Database (MySQL 8.0, DB설계서.md 기준) ----
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.mysql",
        "NAME": os.environ.get("DB_NAME", "fridge_rescue"),
        "USER": os.environ.get("DB_USER", "root"),
        "PASSWORD": os.environ.get("DB_PASSWORD", ""),
        "HOST": os.environ.get("DB_HOST", "127.0.0.1"),
        "PORT": os.environ.get("DB_PORT", "3306"),
        "OPTIONS": {"charset": "utf8mb4"},
    }
}

AUTH_USER_MODEL = "accounts.User"

AUTH_PASSWORD_VALIDATORS = []  # 비밀번호 정책은 기능명세서 규칙(영문+숫자 8자 이상)을 API 레이어에서 직접 검증

LANGUAGE_CODE = "ko-kr"
TIME_ZONE = "UTC"  # DB설계서 1.1절: datetime 컬럼은 UTC 저장, 표시/알림 스케줄만 KST 변환
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# ---- CORS (React 프론트엔드 연동) ----
CORS_ALLOWED_ORIGINS = os.environ.get(
    "CORS_ALLOWED_ORIGINS", "http://localhost:5173"
).split(",")

# ---- DRF ----
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "config.authentication.SessionTokenAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAuthenticated",
    ),
    "EXCEPTION_HANDLER": "config.exceptions.api_exception_handler",
    "DEFAULT_RENDERER_CLASSES": ("rest_framework.renderers.JSONRenderer",),
}

# ---- JWT (API명세서 1.2절: Bearer 토큰) ----
# 액세스/리프레시 토큰 만료 기간은 명세서에 명시되지 않아 개발 기본값으로 정함(추후 조정 가능).
SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=30),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=1),
    "USER_ID_FIELD": "user_id",
    "USER_ID_CLAIM": "user_id",
}
JWT_REFRESH_TOKEN_LIFETIME_DEFAULT = timedelta(days=1)
JWT_REFRESH_TOKEN_LIFETIME_REMEMBER_ME = timedelta(days=14)  # remember_me=true (로그인 상태 유지)

# ---- Celery / Redis (시스템.png: 비동기 작업 큐 + 캐시) ----
REDIS_URL = os.environ.get("REDIS_URL", "redis://127.0.0.1:6379/0")
CELERY_BROKER_URL = REDIS_URL
CELERY_RESULT_BACKEND = REDIS_URL
CELERY_TIMEZONE = "Asia/Seoul"
CELERY_ENABLE_UTC = True
CELERY_BEAT_SCHEDULER = "django_celery_beat.schedulers:DatabaseScheduler"

# ---- Firebase Admin SDK (FCM/APNs Push) ----
FIREBASE_CREDENTIALS_PATH = os.environ.get("FIREBASE_CREDENTIALS_PATH", "")
