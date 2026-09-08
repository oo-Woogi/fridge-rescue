from django.urls import path

from .views import FoodDetailView, FoodListCreateView, FoodSampleView, FoodStatusView, RecipeRecommendView

urlpatterns = [
    path("foods/sample", FoodSampleView.as_view()),
    path("foods", FoodListCreateView.as_view()),
    path("foods/<str:food_id>/status", FoodStatusView.as_view()),
    path("foods/<str:food_id>", FoodDetailView.as_view()),
    path("recipes/recommend", RecipeRecommendView.as_view()),
]
