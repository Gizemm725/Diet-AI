from django.contrib import admin
from .models import (
    UserProfile, Food, DailyIntake, Meal, CustomPlan, 
    CustomPlanFood, AIInteraction, ScannedFood
)


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'age', 'weight', 'height', 'goal', 'activity_level', 'bmi', 'daily_calorie_need')
    list_filter = ('goal', 'activity_level', 'created_at')
    search_fields = ('user__username', 'user__email')
    readonly_fields = ('bmi', 'daily_calorie_need', 'created_at', 'updated_at')


@admin.register(Food)
class FoodAdmin(admin.ModelAdmin):
    list_display = ('name', 'calories', 'protein', 'carbs', 'fat', 'category', 'serving_size')
    list_filter = ('category', 'created_at')
    search_fields = ('name',)
    ordering = ('name',)


@admin.register(DailyIntake)
class DailyIntakeAdmin(admin.ModelAdmin):
    list_display = ('user', 'date', 'total_calories', 'total_protein', 'total_carbs', 'total_fat')
    list_filter = ('date', 'created_at')
    search_fields = ('user__user__username',)
    readonly_fields = ('total_calories', 'total_protein', 'total_carbs', 'total_fat', 'created_at', 'updated_at')


@admin.register(Meal)
class MealAdmin(admin.ModelAdmin):
    list_display = ('daily_intake', 'food', 'quantity', 'calories', 'meal_time', 'created_at')
    list_filter = ('meal_time', 'created_at')
    search_fields = ('food__name', 'daily_intake__user__user__username')
    readonly_fields = ('calories', 'created_at')


@admin.register(CustomPlan)
class CustomPlanAdmin(admin.ModelAdmin):
    list_display = ('user', 'name', 'is_active', 'created_at')
    list_filter = ('is_active', 'created_at')
    search_fields = ('name', 'user__user__username')
    readonly_fields = ('created_at', 'updated_at')


@admin.register(CustomPlanFood)
class CustomPlanFoodAdmin(admin.ModelAdmin):
    list_display = ('custom_plan', 'food', 'quantity', 'meal_time', 'order')
    list_filter = ('meal_time',)
    search_fields = ('custom_plan__name', 'food__name')


@admin.register(AIInteraction)
class AIInteractionAdmin(admin.ModelAdmin):
    list_display = ('user', 'interaction_type', 'created_at')
    list_filter = ('interaction_type', 'created_at')
    search_fields = ('user__user__username', 'message')
    readonly_fields = ('created_at',)


@admin.register(ScannedFood)
class ScannedFoodAdmin(admin.ModelAdmin):
    list_display = ('user', 'food_name', 'calories', 'confidence_score', 'is_processed', 'created_at')
    list_filter = ('is_processed', 'created_at')
    search_fields = ('food_name', 'user__user__username')
    readonly_fields = ('created_at',)
