from rest_framework import serializers

from foods.serializers import FoodListItemSerializer

from .models import NotificationSetting


class NotificationSettingSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationSetting
        fields = ["d1_enabled", "d3_enabled", "notify_time", "timezone"]
        read_only_fields = ["notify_time", "timezone"]


class NotificationSettingUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationSetting
        fields = ["d1_enabled", "d3_enabled"]
        extra_kwargs = {field: {"required": False} for field in fields}


class DeviceTokenSerializer(serializers.Serializer):
    token = serializers.CharField(max_length=255)
