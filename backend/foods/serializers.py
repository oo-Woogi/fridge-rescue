from rest_framework import serializers

from .models import Food


class FoodSerializer(serializers.ModelSerializer):
    d_day = serializers.SerializerMethodField()
    badge = serializers.SerializerMethodField()

    class Meta:
        model = Food
        fields = [
            "food_id",
            "name",
            "category",
            "quantity",
            "purchase_date",
            "expiry_date",
            "storage_location",
            "memo",
            "status",
            "d_day",
            "badge",
            "created_at",
            "updated_at",
            "resolved_at",
        ]
        read_only_fields = ["food_id", "status", "created_at", "updated_at", "resolved_at"]

    def get_d_day(self, obj):
        return obj.d_day

    def get_badge(self, obj):
        return obj.badge


class FoodListItemSerializer(serializers.ModelSerializer):
    d_day = serializers.SerializerMethodField()
    badge = serializers.SerializerMethodField()

    class Meta:
        model = Food
        fields = [
            "food_id",
            "name",
            "category",
            "quantity",
            "storage_location",
            "expiry_date",
            "status",
            "d_day",
            "badge",
        ]

    def get_d_day(self, obj):
        return obj.d_day

    def get_badge(self, obj):
        return obj.badge


class FoodCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Food
        fields = ["name", "category", "quantity", "purchase_date", "expiry_date", "storage_location", "memo"]

    def validate_name(self, value):
        if not value.strip():
            raise serializers.ValidationError("음식명은 공백만 입력할 수 없습니다.")
        return value


class FoodUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Food
        fields = ["name", "category", "quantity", "purchase_date", "expiry_date", "storage_location", "memo"]
        extra_kwargs = {field: {"required": False} for field in fields}


class FoodStatusUpdateSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=["구조", "폐기"])
