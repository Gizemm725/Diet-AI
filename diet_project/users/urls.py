from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    CustomTokenObtainPairView,
    UserRegistrationView,
    UserLoginView,
    UserLogoutView,
    UserProfileView,
    user_info,
    change_password,
    create_meal_from_ai,
    delete_account,
    # Yeni views
    FoodListView,
    FoodDetailView,
    DailyIntakeListView,
    DailyIntakeDetailView,
    MealListView,
    MealDetailView,
    CustomPlanListView,
    CustomPlanDetailView,
    AIInteractionListView,
    AIInteractionDetailView,
    ai_chat,
    ai_chat_history,
    ai_chat_messages,
    ScannedFoodListView,
    ScannedFoodDetailView,
    dashboard_stats,
    weekly_report,
    add_meal_to_daily_intake
)

urlpatterns = [
    # JWT Token endpoints
    path('token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # User authentication endpoints
    path('register/', UserRegistrationView.as_view(), name='user_register'),
    path('login/', UserLoginView.as_view(), name='user_login'),
    path('logout/', UserLogoutView.as_view(), name='user_logout'),
    
    # User profile endpoints
    path('profile/', UserProfileView.as_view(), name='user_profile'),
    path('info/', user_info, name='user_info'),
    path('change-password/', change_password, name='change_password'),
    path('delete-account/', delete_account, name='delete_account'),
    
    # Dashboard ve raporlar
    path('dashboard/', dashboard_stats, name='dashboard_stats'),
    path('weekly-report/', weekly_report, name='weekly_report'),
    
    # Food endpoints
    path('foods/', FoodListView.as_view(), name='food_list'),
    path('foods/<int:pk>/', FoodDetailView.as_view(), name='food_detail'),
    
    # DailyIntake endpoints
    path('daily-intakes/', DailyIntakeListView.as_view(), name='daily_intake_list'),
    path('daily-intakes/<int:pk>/', DailyIntakeDetailView.as_view(), name='daily_intake_detail'),
    
    # Meal endpoints
    path('meals/', MealListView.as_view(), name='meal_list'),
    path('meals/<int:pk>/', MealDetailView.as_view(), name='meal_detail'),
    path('add-meal/', add_meal_to_daily_intake, name='add_meal'),
    
    # CustomPlan endpoints
    path('custom-plans/', CustomPlanListView.as_view(), name='custom_plan_list'),
    path('custom-plans/<int:pk>/', CustomPlanDetailView.as_view(), name='custom_plan_detail'),
    
    # AI Interaction endpoints
    path('ai-interactions/', AIInteractionListView.as_view(), name='ai_interaction_list'),
    path('ai-interactions/<int:pk>/', AIInteractionDetailView.as_view(), name='ai_interaction_detail'),
    path('ai-chat/', ai_chat, name='ai_chat'),
    path('ai-chat/history/', ai_chat_history, name='ai_chat_history'),
    path('ai-chat/messages/<str:chat_id>/', ai_chat_messages, name='ai_chat_messages'),
    path('ai-meal-add/', create_meal_from_ai, name='create_meal_from_ai'),
    # ScannedFood endpoints
    path('scanned-foods/', ScannedFoodListView.as_view(), name='scanned_food_list'),
    path('scanned-foods/<int:pk>/', ScannedFoodDetailView.as_view(), name='scanned_food_detail'),
]
