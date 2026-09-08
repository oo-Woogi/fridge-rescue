from django.urls import path

from .views import FAQListView, RandomStorageTipView

urlpatterns = [
    path("storage-tips/random", RandomStorageTipView.as_view()),
    path("faqs", FAQListView.as_view()),
]
