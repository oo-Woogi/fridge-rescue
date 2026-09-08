"""기능명세서.md 2.9절: 매일 KST 08:00, D-1/D-3 알림 기준을 만족하는 식품에 대해 Push 발송.

Celery Beat 스케줄은 config/celery.py의 beat_schedule에 등록되어 있다
(CELERY_TIMEZONE=Asia/Seoul 이므로 crontab(hour=8, minute=0)이 KST 08:00과 일치).
"""

import datetime

from celery import shared_task

from config.firebase import send_push
from foods.models import Food

from .models import DeviceToken, NotificationSetting


def _foods_with_d_day(user, target_d_day):
    today = datetime.date.today()
    target_date = today + datetime.timedelta(days=target_d_day)
    return Food.objects.filter(user=user, status="보관중", expiry_date=target_date)


@shared_task
def send_daily_expiry_push():
    settings_qs = NotificationSetting.objects.filter(d1_enabled=True) | NotificationSetting.objects.filter(d3_enabled=True)
    for setting in settings_qs.distinct().select_related("user"):
        user = setting.user
        tokens = list(DeviceToken.objects.filter(user=user).values_list("token", flat=True))
        if not tokens:
            continue

        if setting.d1_enabled:
            for food in _foods_with_d_day(user, 1):
                send_push(
                    tokens,
                    title="유통기한이 1일 남았어요",
                    body=f"{food.name}의 유통기한이 내일까지예요. 지금 확인해보세요!",
                    data={"food_id": food.food_id},
                )

        if setting.d3_enabled:
            for food in _foods_with_d_day(user, 3):
                send_push(
                    tokens,
                    title="유통기한이 3일 남았어요",
                    body=f"{food.name}의 유통기한이 3일 남았어요. 잊지 말고 구조해주세요!",
                    data={"food_id": food.food_id},
                )
