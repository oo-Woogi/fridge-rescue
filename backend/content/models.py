from django.db import models

from config.db_fields import UnsignedAutoField, UnsignedIntField


class StorageTip(models.Model):
    """DB설계서.md 3.6 storage_tips 테이블 (전역 참조, 사용자 무관)."""

    tip_id = UnsignedAutoField(primary_key=True)
    message = models.CharField(max_length=200)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "storage_tips"

    def __str__(self):
        return self.message[:30]


class FAQ(models.Model):
    """DB설계서.md 3.7 faqs 테이블."""

    faq_id = UnsignedAutoField(primary_key=True)
    question = models.CharField(max_length=255)
    answer = models.TextField(null=True, blank=True)
    sort_order = UnsignedIntField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "faqs"
        indexes = [models.Index(fields=["sort_order"], name="idx_faqs_sort")]
        ordering = ["sort_order"]

    def __str__(self):
        return self.question
