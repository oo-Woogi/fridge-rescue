import datetime

from django.conf import settings
from django.db import models


class NotificationSetting(models.Model):
    """DB설계서.md 3.4 notification_settings 테이블 (사용자당 1행, 1:1)."""

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        db_column="user_id",
        primary_key=True,
        related_name="notification_setting",
    )
    d1_enabled = models.BooleanField(default=True, db_default=True)
    d3_enabled = models.BooleanField(default=True, db_default=True)
    notify_time = models.TimeField(default=datetime.time(8, 0), db_default=datetime.time(8, 0))  # 고정값, API로 수정 불가
    timezone = models.CharField(max_length=50, default="Asia/Seoul", db_default="Asia/Seoul")  # 고정값
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "notification_settings"


class DeviceToken(models.Model):
    """FCM 푸시 발송을 위한 브라우저 기기 토큰 저장소.

    API명세서.md / DB설계서.md에는 정의되어 있지 않으나, 시스템.png의 Firebase(FCM) 푸시
    인프라를 실제로 동작시키기 위해 사용자 승인 하에 신규로 추가한 테이블/엔드포인트다.
    (POST/DELETE /v1/devices/fcm-token, notifications/urls.py 참조)
    """

    id = models.BigAutoField(primary_key=True)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, db_column="user_id", related_name="device_tokens")
    token = models.CharField(max_length=255, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "device_tokens"
