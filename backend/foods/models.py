import datetime

from django.conf import settings
from django.db import models

from config.db_fields import MySQLEnumField, UnsignedIntField
from config.ids import generate_id

CATEGORY_CHOICES = [
    ("유제품", "유제품"),
    ("채소", "채소"),
    ("과일", "과일"),
    ("육류", "육류"),
    ("기타", "기타"),
]

STORAGE_LOCATION_CHOICES = [
    ("냉장", "냉장"),
    ("냉동", "냉동"),
    ("실온", "실온"),
]

STATUS_CHOICES = [
    ("보관중", "보관중"),
    ("구조", "구조"),
    ("폐기", "폐기"),
]


def _default_food_id():
    return generate_id("food")


class Food(models.Model):
    """DB설계서.md 3.2 foods 테이블."""

    food_id = models.CharField(primary_key=True, max_length=30, editable=False, default=_default_food_id)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, db_column="user_id", related_name="foods")
    name = models.CharField(max_length=100)
    category = MySQLEnumField(max_length=10, choices=CATEGORY_CHOICES)
    quantity = UnsignedIntField(default=1, db_default=1)
    purchase_date = models.DateField(default=datetime.date.today)
    expiry_date = models.DateField()
    storage_location = MySQLEnumField(max_length=4, choices=STORAGE_LOCATION_CHOICES, default="냉장", db_default="냉장")
    memo = models.CharField(max_length=200, null=True, blank=True)
    status = MySQLEnumField(max_length=4, choices=STATUS_CHOICES, default="보관중", db_default="보관중")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    resolved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "foods"
        indexes = [
            models.Index(fields=["user", "status", "expiry_date"], name="idx_foods_user_status_expiry"),
        ]
        constraints = [
            models.CheckConstraint(condition=models.Q(quantity__gte=1), name="chk_foods_quantity"),
        ]

    def __str__(self):
        return self.name

    @property
    def d_day(self):
        return (self.expiry_date - datetime.date.today()).days

    @property
    def badge(self):
        d = self.d_day
        return "유통기한경과" if d < 0 else f"D-{d}"
