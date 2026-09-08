from rest_framework.permissions import AllowAny
from rest_framework.views import APIView

from config.responses import ok

from .models import FAQ, StorageTip


class RandomStorageTipView(APIView):
    def get(self, request):
        tip = StorageTip.objects.filter(is_active=True).order_by("?").first()
        if not tip:
            return ok({"tip_id": None, "message": ""})
        return ok({"tip_id": tip.tip_id, "message": tip.message})


class FAQListView(APIView):
    permission_classes = [AllowAny]  # API명세서 8.1절: 인증 불필요

    def get(self, request):
        items = [
            {"faq_id": f.faq_id, "question": f.question, "answer": f.answer}
            for f in FAQ.objects.order_by("sort_order")
        ]
        return ok({"items": items, "contact_email": "team@fridge-rescue.app"})
