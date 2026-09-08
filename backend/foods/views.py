import datetime

from django.utils import timezone
from rest_framework.response import Response
from rest_framework.views import APIView

from config.exceptions import AppError
from config.responses import ok
from stats.models import FoodActivityLog

from .models import Food
from .serializers import (
    FoodCreateSerializer,
    FoodListItemSerializer,
    FoodSerializer,
    FoodStatusUpdateSerializer,
    FoodUpdateSerializer,
)

SORT_MAP = {
    "expiry_asc": "expiry_date",
    "created_desc": "-created_at",
    "name_asc": "name",
}

# API명세서 4.8절: 데모/온보딩용 더미 식품 (구체적인 항목은 명세서에 없어 새로 정함)
SAMPLE_FOODS = [
    {"name": "우유", "category": "유제품", "quantity": 1, "storage_location": "냉장", "expiry_offset": 0},
    {"name": "상추", "category": "채소", "quantity": 1, "storage_location": "냉장", "expiry_offset": -1},
    {"name": "삼겹살", "category": "육류", "quantity": 2, "storage_location": "냉동", "expiry_offset": 5},
    {"name": "사과", "category": "과일", "quantity": 4, "storage_location": "실온", "expiry_offset": 7},
    {"name": "즉석밥", "category": "기타", "quantity": 3, "storage_location": "실온", "expiry_offset": 2},
]


class RecipeRecommendView(APIView):
    """API명세서 9.1절: AI 레시피 추천 (미구현 placeholder). 항상 501을 반환한다."""

    def post(self, request):
        raise AppError("NOT_IMPLEMENTED", "준비 중인 기능이에요.", status_code=501)


def _get_owned_food(user, food_id):
    try:
        return Food.objects.get(food_id=food_id, user=user)
    except Food.DoesNotExist:
        raise AppError("FOOD_NOT_FOUND", "존재하지 않거나 본인 소유가 아닌 식품입니다.", status_code=404)


class FoodListCreateView(APIView):
    def get(self, request):
        qs = Food.objects.filter(user=request.user)

        q = request.query_params.get("q")
        if q:
            qs = qs.filter(name__icontains=q)

        category = request.query_params.get("category")
        if category:
            qs = qs.filter(category=category)

        storage_location = request.query_params.get("storage_location")
        if storage_location:
            qs = qs.filter(storage_location=storage_location)

        status_param = request.query_params.get("status", "보관중")
        qs = qs.filter(status=status_param)

        sort = request.query_params.get("sort", "expiry_asc")
        qs = qs.order_by(SORT_MAP.get(sort, "expiry_date"))

        limit = request.query_params.get("limit")
        total_count = qs.count()
        if limit:
            qs = qs[: int(limit)]

        return ok({"total_count": total_count, "items": FoodListItemSerializer(qs, many=True).data})

    def post(self, request):
        serializer = FoodCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        food = serializer.save(user=request.user, purchase_date=serializer.validated_data.get("purchase_date") or datetime.date.today())
        return ok(FoodSerializer(food).data, status=201)

    def delete(self, request):
        """전체 식품 데이터 삭제 (SCR-SETTINGS-DELETE)."""
        if request.data.get("confirm") is not True:
            raise AppError("VALIDATION_ERROR", "confirm 값이 true여야 삭제가 수행됩니다.", status_code=400)
        deleted_count, _ = Food.objects.filter(user=request.user).delete()
        return ok({"deleted_count": deleted_count})


class FoodDetailView(APIView):
    def get(self, request, food_id):
        food = _get_owned_food(request.user, food_id)
        return ok(FoodSerializer(food).data)

    def patch(self, request, food_id):
        food = _get_owned_food(request.user, food_id)
        serializer = FoodUpdateSerializer(food, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return ok(FoodSerializer(food).data)

    def delete(self, request, food_id):
        food = _get_owned_food(request.user, food_id)
        food.delete()
        return Response(status=204)


class FoodStatusView(APIView):
    def patch(self, request, food_id):
        food = _get_owned_food(request.user, food_id)
        if food.status != "보관중":
            raise AppError("FOOD_ALREADY_RESOLVED", "이미 처리된 식품입니다.", status_code=409)

        serializer = FoodStatusUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        new_status = serializer.validated_data["status"]

        now = timezone.now()
        food.status = new_status
        food.resolved_at = now
        food.save()

        FoodActivityLog.objects.create(
            user=request.user,
            food=food,
            food_name=food.name,
            category=food.category,
            action=new_status,
            acted_at=now,
        )
        return ok({"food_id": food.food_id, "status": food.status, "resolved_at": food.resolved_at})


class FoodSampleView(APIView):
    def post(self, request):
        today = datetime.date.today()
        created = []
        for item in SAMPLE_FOODS:
            food = Food.objects.create(
                user=request.user,
                name=item["name"],
                category=item["category"],
                quantity=item["quantity"],
                storage_location=item["storage_location"],
                purchase_date=today,
                expiry_date=today + datetime.timedelta(days=item["expiry_offset"]),
            )
            created.append(food)
        return ok(
            {"created_count": len(created), "items": FoodSerializer(created, many=True).data},
            status=201,
        )
