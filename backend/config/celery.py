import os

from celery import Celery
from celery.schedules import crontab

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

app = Celery("fridge_rescue")
app.config_from_object("django.conf:settings", namespace="CELERY")
app.autodiscover_tasks()

# 기능명세서 2.9절 / DB설계서 3.4절: 매일 KST 08:00 알림 발송 (Celery Beat)
app.conf.beat_schedule = {
    "send-daily-expiry-push-notifications": {
        "task": "notifications.tasks.send_daily_expiry_push",
        "schedule": crontab(hour=8, minute=0),  # CELERY_TIMEZONE=Asia/Seoul 기준 08:00
    },
}
