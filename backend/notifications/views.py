from rest_framework.response import Response
from rest_framework.views import APIView

from config.responses import ok
from foods.models import Food
from foods.serializers import FoodListItemSerializer

from .models import DeviceToken, NotificationSetting
from .serializers import DeviceTokenSerializer, NotificationSettingSerializer, NotificationSettingUpdateSerializer


class NotificationListView(APIView):
    def get(self, request):
        qs = Food.objects.filter(user=request.user, status="보관중")
        q = request.query_params.get("q")
        if q:
            qs = qs.filter(name__icontains=q)
        filter_param = request.query_params.get("filter", "all")

        today_expiring, within_3_days, expired = [], [], []
        for food in qs:
            d = food.d_day
            if d == 0:
                today_expiring.append(food)
            elif 1 <= d <= 3:
                within_3_days.append(food)
            elif d < 0:
                expired.append(food)

        if filter_param == "today":
            within_3_days, expired = [], []
        elif filter_param == "within_3_days":
            today_expiring, expired = [], []
        elif filter_param == "expired":
            today_expiring, within_3_days = [], []

        return ok(
            {
                "today_expiring": FoodListItemSerializer(today_expiring, many=True).data,
                "within_3_days": FoodListItemSerializer(within_3_days, many=True).data,
                "expired": FoodListItemSerializer(expired, many=True).data,
            }
        )


class NotificationSettingsView(APIView):
    def _get_or_create(self, user):
        setting, _ = NotificationSetting.objects.get_or_create(user=user)
        return setting

    def get(self, request):
        setting = self._get_or_create(request.user)
        return ok(NotificationSettingSerializer(setting).data)

    def patch(self, request):
        setting = self._get_or_create(request.user)
        serializer = NotificationSettingUpdateSerializer(setting, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return ok(NotificationSettingSerializer(setting).data)


class DeviceTokenView(APIView):
    """시스템.png Firebase(FCM) 푸시 인프라를 위해 신규로 추가한 엔드포인트(사용자 승인, API명세서 범위 외)."""

    def post(self, request):
        serializer = DeviceTokenSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        DeviceToken.objects.update_or_create(
            token=serializer.validated_data["token"],
            defaults={"user": request.user},
        )
        return ok(status=201)

    def delete(self, request):
        serializer = DeviceTokenSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        DeviceToken.objects.filter(user=request.user, token=serializer.validated_data["token"]).delete()
        return Response(status=204)
