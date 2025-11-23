from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator, MaxValueValidator


class UserProfile(models.Model):
    """Kullanıcı profil bilgileri ve kişiselleştirme"""
    GOAL_CHOICES = [
        ('lose_weight', 'Kilo Vermek'),
        ('gain_weight', 'Kilo Almak'),
        ('healthy_eating', 'Sağlıklı Beslenmek'),
        ('athlete', 'Sporcu'),
        ('maintain', 'Kilo Korumak'),
    ]
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    age = models.PositiveIntegerField(validators=[MinValueValidator(1), MaxValueValidator(120)])
    weight = models.FloatField(validators=[MinValueValidator(20.0), MaxValueValidator(300.0)], help_text="kg")
    height = models.FloatField(validators=[MinValueValidator(50.0), MaxValueValidator(250.0)], help_text="cm")
    goal = models.CharField(max_length=20, choices=GOAL_CHOICES, default='healthy_eating')
    activity_level = models.CharField(max_length=20, choices=[
        ('sedentary', 'Hareketsiz'),
        ('light', 'Hafif Aktif'),
        ('moderate', 'Orta Aktif'),
        ('active', 'Aktif'),
        ('very_active', 'Çok Aktif'),
    ], default='moderate')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.user.username} - {self.get_goal_display()}"
    
    @property
    def bmi(self):
        """BMI hesapla"""
        if self.height > 0:
            return round(self.weight / ((self.height / 100) ** 2), 1)
        return 0
    
    @property
    def daily_calorie_need(self):
        """Günlük kalori ihtiyacını hesapla (Harris-Benedict formülü)"""
        # Basit hesaplama - erkek/kadın ayrımı yapmadan
        bmr = 88.362 + (13.397 * self.weight) + (4.799 * self.height) - (5.677 * self.age)
        
        activity_multipliers = {
            'sedentary': 1.2,
            'light': 1.375,
            'moderate': 1.55,
            'active': 1.725,
            'very_active': 1.9,
        }
        
        return round(bmr * activity_multipliers.get(self.activity_level, 1.55))


class Food(models.Model):
    """Yemek/ürün bilgisi"""
    CATEGORY_CHOICES = [
        ('breakfast', 'Kahvaltı'),
        ('lunch', 'Öğle Yemeği'),
        ('dinner', 'Akşam Yemeği'),
        ('snack', 'Atıştırmalık'),
        ('beverage', 'İçecek'),
        ('fruit', 'Meyve'),
        ('vegetable', 'Sebze'),
        ('protein', 'Protein'),
        ('carb', 'Karbonhidrat'),
        ('fat', 'Yağ'),
    ]
    
    name = models.CharField(max_length=200, unique=True)
    calories = models.FloatField(validators=[MinValueValidator(0)])
    protein = models.FloatField(null=True, blank=True, validators=[MinValueValidator(0)], help_text="gram")
    carbs = models.FloatField(null=True, blank=True, validators=[MinValueValidator(0)], help_text="gram")
    fat = models.FloatField(null=True, blank=True, validators=[MinValueValidator(0)], help_text="gram")
    fiber = models.FloatField(null=True, blank=True, validators=[MinValueValidator(0)], help_text="gram")
    sugar = models.FloatField(null=True, blank=True, validators=[MinValueValidator(0)], help_text="gram")
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='snack')
    serving_size = models.CharField(max_length=100, default="100g", help_text="Porsiyon boyutu")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.name} ({self.calories} kcal)"
    
    class Meta:
        ordering = ['name']


class DailyIntake(models.Model):
    """Kullanıcının günlük kalori takibi"""
    user = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name='daily_intakes')
    date = models.DateField()
    total_calories = models.FloatField(default=0, validators=[MinValueValidator(0)])
    total_protein = models.FloatField(default=0, validators=[MinValueValidator(0)])
    total_carbs = models.FloatField(default=0, validators=[MinValueValidator(0)])
    total_fat = models.FloatField(default=0, validators=[MinValueValidator(0)])
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.user.user.username} - {self.date} ({self.total_calories} kcal)"
    
    class Meta:
        unique_together = ['user', 'date']
        ordering = ['-date']


class Meal(models.Model):
    """Kullanıcının yediği öğünler/yiyecekler"""
    MEAL_TIME_CHOICES = [
        ('breakfast', 'Kahvaltı'),
        ('lunch', 'Öğle Yemeği'), 
        ('dinner', 'Akşam Yemeği'),
        ('snack', 'Atıştırmalık'),
    ]
    
    daily_intake = models.ForeignKey(DailyIntake, on_delete=models.CASCADE, related_name='meals')
    food = models.ForeignKey(Food, on_delete=models.CASCADE)
    quantity = models.FloatField(validators=[MinValueValidator(0.1)], help_text="Miktar")
    calories = models.FloatField(validators=[MinValueValidator(0)], help_text="Hesaplanan kalori")
    meal_time = models.CharField(max_length=20, choices=MEAL_TIME_CHOICES, default='snack')
    notes = models.TextField(blank=True, null=True, help_text="Ek notlar")
    created_at = models.DateTimeField(auto_now_add=True)
    
    def save(self, *args, **kwargs):
        """Kaloriyi otomatik hesapla"""
        self.calories = round(self.food.calories * self.quantity, 2)
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.daily_intake.user.user.username} - {self.food.name} ({self.quantity}x) - {self.calories} kcal"
    
    class Meta:
        ordering = ['-created_at']


class CustomPlan(models.Model):
    """Kullanıcının özel planı"""
    user = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name='custom_plans')
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.user.user.username} - {self.name}"
    
    class Meta:
        ordering = ['-created_at']


class CustomPlanFood(models.Model):
    """Planla ilişkilendirilen yiyecekler"""
    custom_plan = models.ForeignKey(CustomPlan, on_delete=models.CASCADE, related_name='plan_foods')
    food = models.ForeignKey(Food, on_delete=models.CASCADE)
    quantity = models.FloatField(validators=[MinValueValidator(0.1)])
    meal_time = models.CharField(max_length=20, choices=Meal.MEAL_TIME_CHOICES, default='snack')
    order = models.PositiveIntegerField(default=0, help_text="Sıralama")
    
    def __str__(self):
        return f"{self.custom_plan.name} - {self.food.name} ({self.quantity}x)"
    
    class Meta:
        ordering = ['order', 'meal_time']


class AIInteraction(models.Model):
    """AI agent ile yapılan konuşmalar"""
    user = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name='ai_interactions')
    message = models.TextField()
    response = models.TextField()
    interaction_type = models.CharField(max_length=50, choices=[
        ('general', 'Genel Sohbet'),
        ('nutrition_advice', 'Beslenme Önerisi'),
        ('meal_planning', 'Öğün Planlama'),
        ('motivation', 'Motivasyon'),
        ('question', 'Soru'),
    ], default='general')
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.user.user.username} - {self.interaction_type} - {self.created_at.strftime('%Y-%m-%d %H:%M')}"
    
    class Meta:
        ordering = ['-created_at']


class ScannedFood(models.Model):
    """OCR ile taranan yiyecekler"""
    user = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name='scanned_foods')
    food_name = models.CharField(max_length=200)
    calories = models.FloatField(null=True, blank=True, validators=[MinValueValidator(0)])
    confidence_score = models.FloatField(null=True, blank=True, help_text="OCR güven skoru")
    image_path = models.CharField(max_length=500, blank=True, null=True, help_text="Taranan görsel yolu")
    is_processed = models.BooleanField(default=False, help_text="AI tarafından işlendi mi?")
    ai_suggestion = models.TextField(blank=True, null=True, help_text="AI önerisi")
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.user.user.username} - {self.food_name} ({self.created_at.strftime('%Y-%m-%d')})"
    
    class Meta:
        ordering = ['-created_at']


# Signal'lar - DailyIntake'i otomatik güncellemek için
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver

@receiver(post_save, sender=Meal)
@receiver(post_delete, sender=Meal)
def update_daily_intake(sender, instance, **kwargs):
    """Meal kaydedildiğinde/silindiğinde DailyIntake'i güncelle"""
    daily_intake = instance.daily_intake
    meals = daily_intake.meals.all()
    
    daily_intake.total_calories = sum(meal.calories for meal in meals)
    daily_intake.total_protein = sum(meal.food.protein * meal.quantity for meal in meals if meal.food.protein)
    daily_intake.total_carbs = sum(meal.food.carbs * meal.quantity for meal in meals if meal.food.carbs)
    daily_intake.total_fat = sum(meal.food.fat * meal.quantity for meal in meals if meal.food.fat)
    
    daily_intake.save()
