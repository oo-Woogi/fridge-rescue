import datetime
from zoneinfo import ZoneInfo

from django.utils import timezone
from rest_framework.views import APIView

from config.exceptions import AppError
from config.responses import ok
from foods.models import CATEGORY_CHOICES, Food

from .models import FoodActivityLog

KST = ZoneInfo("Asia/Seoul")


def _period_range(period, today_kst):
    """(현재 기간 시작, 현재 기간 끝(미포함), 직전 동일 기간 시작, 직전 동일 기간 끝) 을 KST 자정 기준으로 반환."""
    if period == "today":
        start = today_kst
        end = start + datetime.timedelta(days=1)
        prev_start = start - datetime.timedelta(days=1)
        prev_end = start
    elif period == "week":
        start = today_kst - datetime.timedelta(days=today_kst.weekday())  # 이번 주 월요일
        end = start + datetime.timedelta(days=7)
        prev_start = start - datetime.timedelta(days=7)
        prev_end = start
    elif period == "month":
        start = today_kst.replace(day=1)
        if start.month == 12:
            end = start.replace(year=start.year + 1, month=1)
        else:
            end = start.replace(month=start.month + 1)
        prev_end = start
        if start.month == 1:
            prev_start = start.replace(year=start.year - 1, month=12)
        else:
            prev_start = start.replace(month=start.month - 1)
    else:
        raise AppError("VALIDATION_ERROR", "period는 today, week, month 중 하나여야 합니다.", status_code=422)

    def to_utc(d):
        return datetime.datetime.combine(d, datetime.time.min, tzinfo=KST).astimezone(datetime.timezone.utc)

    return to_utc(start), to_utc(end), to_utc(prev_start), to_utc(prev_end)


def _count_actions(user, start, end):
    qs = FoodActivityLog.objects.filter(user=user, acted_at__gte=start, acted_at__lt=end)
    rescued = qs.filter(action="구조").count()
    discarded = qs.filter(action="폐기").count()
    return rescued, discarded


def _rescue_rate(rescued, discarded):
    denom = rescued + discarded
    return round(rescued / denom * 100) if denom else 0


class StatsView(APIView):
    def get(self, request):
        period = request.query_params.get("period")
        if period not in ("today", "week", "month"):
            raise AppError("VALIDATION_ERROR", "period 파라미터가 필요합니다(today|week|month).", status_code=422)

        user = request.user
        today_kst = timezone.now().astimezone(KST).date()
        start, end, prev_start, prev_end = _period_range(period, today_kst)

        rescued_count, discarded_count = _count_actions(user, start, end)
        prev_rescued, prev_discarded = _count_actions(user, prev_start, prev_end)

        rescue_rate = _rescue_rate(rescued_count, discarded_count)
        prev_rescue_rate = _rescue_rate(prev_rescued, prev_discarded)

        # 임박 음식 수: 조회 시점 기준 보관중 + D-day 0~3 (기능명세서 1.2절 "임박 음식" 정의)
        upcoming_qs = Food.objects.filter(user=user, status="보관중")
        upcoming_count = sum(1 for f in upcoming_qs if 0 <= f.d_day <= 3)

        category_breakdown = []
        for code, _label in CATEGORY_CHOICES:
            count = FoodActivityLog.objects.filter(
                user=user, action="구조", category=code, acted_at__gte=start, acted_at__lt=end
            ).count()
            category_breakdown.append({"category": code, "rescued_count": count})

        # 상태 비중(도넛): 사용자가 등록한 전체 식품 기준 정상/임박/폐기 비율
        # (기능명세서에 정확한 산정식이 없어 "현재 보관중=정상/임박, status=폐기=폐기"로 정함)
        all_foods = list(Food.objects.filter(user=user))
        total_all = len(all_foods)
        discarded_all = sum(1 for f in all_foods if f.status == "폐기")
        upcoming_all = sum(1 for f in all_foods if f.status == "보관중" and 0 <= f.d_day <= 3)
        normal_all = total_all - discarded_all - upcoming_all

        def pct(n):
            return round(n / total_all * 100) if total_all else 0

        recent_activities = FoodActivityLog.objects.filter(user=user).order_by("-acted_at")[:5]

        return ok(
            {
                "period": period,
                "rescued_count": rescued_count,
                "rescued_delta": rescued_count - prev_rescued,
                "discarded_count": discarded_count,
                "discarded_delta": discarded_count - prev_discarded,
                "rescue_rate": rescue_rate,
                "rescue_rate_delta": rescue_rate - prev_rescue_rate,
                "upcoming_count": upcoming_count,
                "upcoming_delta": 0,  # 임박 음식 수는 스냅샷 값이라 직전 기간 비교값을 보관하지 않음
                "category_breakdown": category_breakdown,
                "status_ratio": {
                    "total_count": total_all,
                    "normal_pct": pct(normal_all),
                    "upcoming_pct": pct(upcoming_all),
                    "discarded_pct": pct(discarded_all),
                },
                "recent_activities": [
                    {
                        "food_id": log.food_id,
                        "name": log.food_name,
                        "action": log.action,
                        "acted_at": log.acted_at,
                    }
                    for log in recent_activities
                ],
            }
        )
