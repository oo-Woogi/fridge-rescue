from django.urls import path

from .views import DeviceTokenView, NotificationListView, NotificationSettingsView

urlpatterns = [
    path("notifications", NotificationListView.as_view()),
    path("notification-settings", NotificationSettingsView.as_view()),
    path("devices/fcm-token", DeviceTokenView.as_view()),
]
