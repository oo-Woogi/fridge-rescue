from django.conf import settings
from django.db import models

from config.db_fields import MySQLEnumField, UnsignedBigAutoField
from foods.models import CATEGORY_CHOICES, Food

ACTION_CHOICES = [
    ("구조", "구조"),
    ("폐기", "폐기"),
]


class FoodActivityLog(models.Model):
    """DB설계서.md 3.3 food_activity_logs 테이블 (append-only 이력)."""

    log_id = UnsignedBigAutoField(primary_key=True)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, db_column="user_id", related_name="activity_logs")
    food = models.ForeignKey(Food, on_delete=models.SET_NULL, db_column="food_id", null=True, blank=True, related_name="activity_logs")
    food_name = models.CharField(max_length=100)
    category = MySQLEnumField(max_length=10, choices=CATEGORY_CHOICES)
    action = MySQLEnumField(max_length=4, choices=ACTION_CHOICES)
    acted_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "food_activity_logs"
        indexes = [
            models.Index(fields=["user", "acted_at"], name="idx_logs_user_acted"),
            models.Index(fields=["user", "action", "acted_at"], name="idx_logs_user_action_acted"),
        ]
