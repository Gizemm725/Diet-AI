from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import (
    UserProfile, Food, DailyIntake, Meal, CustomPlan, 
    CustomPlanFood, AIInteraction, ScannedFood
)


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)
    # Profile fields
    age = serializers.IntegerField(min_value=1, max_value=120)
    weight = serializers.FloatField(required=False, min_value=20.0, max_value=300.0)
    height = serializers.FloatField(required=False, min_value=50.0, max_value=250.0)
    goal = serializers.ChoiceField(required=False, choices=UserProfile.GOAL_CHOICES)
    activity_level = serializers.ChoiceField(
        required=False,
        choices=[
            ('sedentary', 'Hareketsiz'),
            ('light', 'Hafif Aktif'),
            ('moderate', 'Orta Aktif'),
            ('active', 'Aktif'),
            ('very_active', 'Çok Aktif'),
        ]
    )
    
    class Meta:
        model = User
        fields = (
            'username', 'email', 'first_name', 'last_name',
            'password', 'password_confirm',
            'age', 'weight', 'height', 'goal', 'activity_level'
        )
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError("Şifreler eşleşmiyor.")
        return attrs
    
    def create(self, validated_data):
        # Extract profile fields before creating User
        password_confirm = validated_data.pop('password_confirm')
        age = validated_data.pop('age')
        weight = validated_data.pop('weight', None)
        height = validated_data.pop('height', None)
        goal = validated_data.pop('goal', None)
        activity_level = validated_data.pop('activity_level', None)

        user = User.objects.create_user(**validated_data)

        # Update related profile
        profile = user.profile  # created by signal with safe defaults
        profile.age = age
        if weight is not None:
            profile.weight = weight
        if height is not None:
            profile.height = height
        if goal is not None:
            profile.goal = goal
        if activity_level is not None:
            profile.activity_level = activity_level
        profile.save()

        return user


class UserLoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField()
    
    def validate(self, attrs):
        username = attrs.get('username')
        password = attrs.get('password')
        
        if username and password:
            user = authenticate(username=username, password=password)
            if not user:
                raise serializers.ValidationError('Geçersiz kullanıcı adı veya şifre.')
            if not user.is_active:
                raise serializers.ValidationError('Kullanıcı hesabı devre dışı.')
            attrs['user'] = user
        else:
            raise serializers.ValidationError('Kullanıcı adı ve şifre gerekli.')
        
        return attrs


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'date_joined', 'last_login')
        read_only_fields = ('id', 'date_joined', 'last_login')


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        
        # Add custom claims
        token['username'] = user.username
        token['email'] = user.email
        token['first_name'] = user.first_name
        token['last_name'] = user.last_name
        
        return token


# Yeni Serializers
class UserProfileDetailSerializer(serializers.ModelSerializer):
    bmi = serializers.ReadOnlyField()
    daily_calorie_need = serializers.ReadOnlyField()
    
    class Meta:
        model = UserProfile
        fields = '__all__'
        read_only_fields = ('user', 'created_at', 'updated_at')


class FoodSerializer(serializers.ModelSerializer):
    class Meta:
        model = Food
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at')


class MealSerializer(serializers.ModelSerializer):
    food_name = serializers.CharField(source='food.name', read_only=True)
    food_calories = serializers.FloatField(source='food.calories', read_only=True)
    
    class Meta:
        model = Meal
        fields = '__all__'
        read_only_fields = ('calories', 'created_at')


class DailyIntakeSerializer(serializers.ModelSerializer):
    meals = MealSerializer(many=True, read_only=True)
    user_username = serializers.CharField(source='user.user.username', read_only=True)
    
    class Meta:
        model = DailyIntake
        fields = '__all__'
        read_only_fields = ('total_calories', 'total_protein', 'total_carbs', 'total_fat', 'created_at', 'updated_at')


class CustomPlanFoodSerializer(serializers.ModelSerializer):
    food_name = serializers.CharField(source='food.name', read_only=True)
    food_calories = serializers.FloatField(source='food.calories', read_only=True)
    
    class Meta:
        model = CustomPlanFood
        fields = '__all__'


class CustomPlanSerializer(serializers.ModelSerializer):
    plan_foods = CustomPlanFoodSerializer(many=True, read_only=True)
    user_username = serializers.CharField(source='user.user.username', read_only=True)
    
    class Meta:
        model = CustomPlan
        fields = '__all__'
        read_only_fields = ('user', 'created_at', 'updated_at')


class AIInteractionSerializer(serializers.ModelSerializer):
    user_username = serializers.CharField(source='user.user.username', read_only=True)
    
    class Meta:
        model = AIInteraction
        fields = '__all__'
        read_only_fields = ('user', 'created_at')


class ScannedFoodSerializer(serializers.ModelSerializer):
    user_username = serializers.CharField(source='user.user.username', read_only=True)
    
    class Meta:
        model = ScannedFood
        fields = '__all__'
        read_only_fields = ('user', 'created_at')


# Özel Serializers
class MealCreateSerializer(serializers.ModelSerializer):
    """Yeni öğün eklemek için"""
    class Meta:
        model = Meal
        fields = ('food', 'quantity', 'meal_time', 'notes')
    
    def create(self, validated_data):
        # DailyIntake'i otomatik oluştur veya getir
        user_profile = self.context['request'].user.profile
        date = self.context['date']
        
        daily_intake, created = DailyIntake.objects.get_or_create(
            user=user_profile,
            date=date,
            defaults={'total_calories': 0}
        )
        
        validated_data['daily_intake'] = daily_intake
        return super().create(validated_data)


class DailyIntakeCreateSerializer(serializers.ModelSerializer):
    """Günlük takip oluşturmak için"""
    class Meta:
        model = DailyIntake
        fields = ('date',)
    
    def create(self, validated_data):
        user_profile = self.context['request'].user.profile
        validated_data['user'] = user_profile
        return super().create(validated_data)


# Gelişmiş Besin Arama Serializers
class FoodSearchSerializer(serializers.ModelSerializer):
    """Besin arama için özel serializer"""
    class Meta:
        model = Food
        fields = ('id', 'name', 'calories', 'protein', 'carbs', 'fat', 'fiber', 'sugar', 'category', 'serving_size')


class FoodFilterSerializer(serializers.Serializer):
    """Besin filtreleme parametreleri"""
    search = serializers.CharField(required=False, allow_blank=True, help_text="Yiyecek adında arama")
    category = serializers.CharField(required=False, allow_blank=True, help_text="Kategori filtresi")
    min_calories = serializers.FloatField(required=False, min_value=0, help_text="Minimum kalori")
    max_calories = serializers.FloatField(required=False, min_value=0, help_text="Maksimum kalori")
    min_protein = serializers.FloatField(required=False, min_value=0, help_text="Minimum protein")
    max_protein = serializers.FloatField(required=False, min_value=0, help_text="Maksimum protein")
    min_carbs = serializers.FloatField(required=False, min_value=0, help_text="Minimum karbonhidrat")
    max_carbs = serializers.FloatField(required=False, min_value=0, help_text="Maksimum karbonhidrat")
    min_fat = serializers.FloatField(required=False, min_value=0, help_text="Minimum yağ")
    max_fat = serializers.FloatField(required=False, min_value=0, help_text="Maksimum yağ")
    ordering = serializers.ChoiceField(
        required=False,
        choices=['name', '-name', 'calories', '-calories', 'protein', '-protein'],
        help_text="Sıralama: name, -name, calories, -calories, protein, -protein"
    )


# Diyet Planı Serializers
class CustomPlanFoodCreateSerializer(serializers.ModelSerializer):
    """Plan'a yiyecek eklemek için"""
    class Meta:
        model = CustomPlanFood
        fields = ('food', 'quantity', 'meal_time', 'order')
    
    def create(self, validated_data):
        custom_plan = self.context['custom_plan']
        validated_data['custom_plan'] = custom_plan
        return super().create(validated_data)


class CustomPlanFoodUpdateSerializer(serializers.ModelSerializer):
    """Plan yiyeceğini güncellemek için"""
    class Meta:
        model = CustomPlanFood
        fields = ('quantity', 'meal_time', 'order')


class CustomPlanWithFoodsSerializer(serializers.ModelSerializer):
    """Plan detayı ile yiyecekleri"""
    plan_foods = CustomPlanFoodSerializer(many=True, read_only=True)
    user_username = serializers.CharField(source='user.user.username', read_only=True)
    total_calories = serializers.SerializerMethodField()
    total_protein = serializers.SerializerMethodField()
    total_carbs = serializers.SerializerMethodField()
    total_fat = serializers.SerializerMethodField()
    
    class Meta:
        model = CustomPlan
        fields = '__all__'
        read_only_fields = ('user', 'created_at', 'updated_at')
    
    def get_total_calories(self, obj):
        return sum(food.food.calories * food.quantity for food in obj.plan_foods.all())
    
    def get_total_protein(self, obj):
        return sum(food.food.protein * food.quantity for food in obj.plan_foods.all() if food.food.protein)
    
    def get_total_carbs(self, obj):
        return sum(food.food.carbs * food.quantity for food in obj.plan_foods.all() if food.food.carbs)
    
    def get_total_fat(self, obj):
        return sum(food.food.fat * food.quantity for food in obj.plan_foods.all() if food.food.fat)


# Plan Önerisi Serializers
class PlanRecommendationSerializer(serializers.Serializer):
    """Plan önerisi için"""
    goal = serializers.ChoiceField(choices=UserProfile.GOAL_CHOICES)
    daily_calories = serializers.FloatField(min_value=1000, max_value=5000)
    protein_ratio = serializers.FloatField(min_value=0.1, max_value=0.5, default=0.25)
    carb_ratio = serializers.FloatField(min_value=0.3, max_value=0.7, default=0.5)
    fat_ratio = serializers.FloatField(min_value=0.2, max_value=0.4, default=0.25)
    meal_count = serializers.IntegerField(min_value=3, max_value=6, default=4)

