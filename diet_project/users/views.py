import os
import re
import requests
from datetime import date, datetime, timedelta
from dotenv import load_dotenv

from rest_framework import status, generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.exceptions import ValidationError
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.exceptions import TokenError

from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from django.db.models import Q, Sum, F

import base64
from django.core.files.uploadedfile import InMemoryUploadedFile
from django.views.decorators.csrf import csrf_exempt

# Model ve Serializer Importları
from .models import (
    UserProfile, Food, DailyIntake, Meal, CustomPlan, 
    CustomPlanFood, AIInteraction, ScannedFood
)
from .serializers import (
    UserRegistrationSerializer, 
    UserLoginSerializer, 
    UserProfileDetailSerializer,
    CustomTokenObtainPairSerializer,
    FoodSerializer,
    FoodSearchSerializer,
    MealSerializer,
    DailyIntakeSerializer,
    CustomPlanWithFoodsSerializer,
    CustomPlanFoodSerializer,
    CustomPlanFoodCreateSerializer,
    AIInteractionSerializer,
    ScannedFoodSerializer,
    MealCreateSerializer,
    DailyIntakeCreateSerializer
)

# RAG Importları
from .rag import search as rag_search, build_context_from_history as rag_build_ctx, add_interaction as rag_add

# Ortam Değişkenleri
load_dotenv() 
OPENROUTER_KEY = os.getenv("OPENROUTER_API_KEY")
OPENROUTER_MODEL = os.getenv("OPENROUTER_MODEL")

# --- YARDIMCI FONKSİYONLAR ---

def clean_number(value):
    """
    AI'dan gelen veriyi (örn: '100 kcal', '12.5g', None, 'yaklaşık 20') 
    temiz float sayıya çevirir.
    """
    if value is None:
        return 0.0
    if isinstance(value, (int, float)):
        return float(value)
    
    value_str = str(value)
    # Sadece rakamları ve noktayı al (harfleri sil)
    cleaned = re.sub(r'[^\d.]', '', value_str)
    
    try:
        # Çift nokta varsa ilkini al veya hata verirse 0 dön
        return float(cleaned) if cleaned else 0.0
    except ValueError:
        return 0.0

# --- VIEWS ---

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


class UserRegistrationView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response({
            'message': 'Kullanıcı başarıyla oluşturuldu.',
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
            },
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        }, status=status.HTTP_201_CREATED)


class UserLoginView(APIView):
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = UserLoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            refresh = RefreshToken.for_user(user)
            return Response({
                'message': 'Giriş başarılı.',
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                },
                'tokens': {
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                }
            }, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserLogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]
     
    def post(self, request):
        try:
            refresh_token = request.data.get('refresh_token')
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
                return Response({'message': 'Çıkış başarılı.'}, status=status.HTTP_200_OK)
            else:
                raise ValidationError('Refresh token gerekli.')
        except TokenError:
            raise ValidationError('Geçersiz token.')


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def user_info(request):
    user = request.user
    return Response({
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'first_name': user.first_name,
        'last_name': user.last_name,
        'date_joined': user.date_joined,
        'last_login': user.last_login,
    })


@api_view(['DELETE'])
@permission_classes([permissions.IsAuthenticated])
def delete_account(request):
    try:
        user = request.user
        user.delete()
        return Response({'message': 'Hesap başarıyla silindi.'}, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({'error': f'Hesap silinirken hata oluştu: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def change_password(request):
    user = request.user
    old_password = request.data.get('old_password')
    new_password = request.data.get('new_password')
    
    if not old_password or not new_password:
        return Response({'error': 'Eski şifre ve yeni şifre gerekli.'}, status=status.HTTP_400_BAD_REQUEST)
    if not user.check_password(old_password):
        return Response({'error': 'Eski şifre yanlış.'}, status=status.HTTP_400_BAD_REQUEST)
    if len(new_password) < 8:
        return Response({'error': 'Yeni şifre en az 8 karakter olmalı.'}, status=status.HTTP_400_BAD_REQUEST)
    
    user.set_password(new_password)
    user.save()
    return Response({'message': 'Şifre başarıyla değiştirildi.'}, status=status.HTTP_200_OK)


class UserProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserProfileDetailSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        profile, created = UserProfile.objects.get_or_create(
            user=self.request.user,
            defaults={
                'age': 25,
                'weight': 70.0,
                'height': 170.0,
                'goal': 'healthy_eating',
                'activity_level': 'moderate'
            }
        )
        return profile
    
    def get(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        # Serializer zaten to_representation ile user bilgilerini ekliyor
        return Response(serializer.data)
    
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', True)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        if getattr(instance, '_prefetched_object_cache', None):
            instance._prefetched_object_cache = {}
        # Güncellenmiş veriyi döndür (serializer zaten user bilgilerini ekliyor)
        return Response(serializer.data)


class FoodListView(generics.ListAPIView):
    serializer_class = FoodSearchSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        queryset = Food.objects.all()
        search = self.request.query_params.get('search', None)
        category = self.request.query_params.get('category', None)
        # Diğer filtreler...
        if search:
            queryset = queryset.filter(name__icontains=search)
        if category:
            queryset = queryset.filter(category=category)
        # (Diğer filtreler buraya eklenebilir, kısalttım)
        
        ordering = self.request.query_params.get('ordering', 'name')
        if ordering in ['name', '-name', 'calories', '-calories', 'protein', '-protein']:
            queryset = queryset.order_by(ordering)
        return queryset


class FoodDetailView(generics.RetrieveAPIView):
    serializer_class = FoodSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = Food.objects.all()


class DailyIntakeListView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return DailyIntakeCreateSerializer
        return DailyIntakeSerializer
    def get_queryset(self):
        return DailyIntake.objects.filter(user=self.request.user.profile)
    def perform_create(self, serializer):
        serializer.save(user=self.request.user.profile)


class DailyIntakeDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = DailyIntakeSerializer
    permission_classes = [permissions.IsAuthenticated]
    def get_queryset(self):
        return DailyIntake.objects.filter(user=self.request.user.profile)


class MealListView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return MealCreateSerializer
        return MealSerializer
    
    def get_queryset(self):
        user_profile = self.request.user.profile
        date_param = self.request.query_params.get('date', date.today())
        try:
            date_obj = datetime.strptime(date_param, '%Y-%m-%d').date()
        except ValueError:
            date_obj = date.today()
        
        daily_intake = DailyIntake.objects.filter(user=user_profile, date=date_obj).first()
        if daily_intake:
            return Meal.objects.filter(daily_intake=daily_intake)
        return Meal.objects.none()
    
    def perform_create(self, serializer):
        date_param = self.request.data.get('date', date.today())
        try:
            date_obj = datetime.strptime(date_param, '%Y-%m-%d').date()
        except ValueError:
            date_obj = date.today()
        serializer.context['date'] = date_obj
        meal = serializer.save()
        # Signal hallediyor ama manuel tetikleme de yapılabilir


class MealDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = MealSerializer
    permission_classes = [permissions.IsAuthenticated]
    def get_queryset(self):
        return Meal.objects.filter(daily_intake__user=self.request.user.profile)


class CustomPlanListView(generics.ListCreateAPIView):
    serializer_class = CustomPlanWithFoodsSerializer
    permission_classes = [permissions.IsAuthenticated]
    def get_queryset(self):
        return CustomPlan.objects.filter(user=self.request.user.profile)
    def perform_create(self, serializer):
        serializer.save(user=self.request.user.profile)


class CustomPlanDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = CustomPlanWithFoodsSerializer
    permission_classes = [permissions.IsAuthenticated]
    def get_queryset(self):
        return CustomPlan.objects.filter(user=self.request.user.profile)


class AIInteractionListView(generics.ListCreateAPIView):
    serializer_class = AIInteractionSerializer
    permission_classes = [permissions.IsAuthenticated]
    def get_queryset(self):
        return AIInteraction.objects.filter(user=self.request.user.profile)
    def perform_create(self, serializer):
        serializer.save(user=self.request.user.profile)


class AIInteractionDetailView(generics.RetrieveAPIView):
    serializer_class = AIInteractionSerializer
    permission_classes = [permissions.IsAuthenticated]
    def get_queryset(self):
        return AIInteraction.objects.filter(user=self.request.user.profile)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def ai_chat_history(request):
    try:
        user_profile = request.user.profile
    except UserProfile.DoesNotExist:
        return Response({'error': 'Kullanıcının profili yok.'}, status=status.HTTP_400_BAD_REQUEST)
    
    from collections import defaultdict
    interactions = AIInteraction.objects.filter(user=user_profile).order_by('-created_at')
    chats = defaultdict(list)
    for interaction in interactions:
        date_key = interaction.created_at.date().isoformat()
        chats[date_key].append({
            'id': interaction.id,
            'message': interaction.message,
            'response': interaction.response,
            'created_at': interaction.created_at.isoformat(),
        })
    
    chat_list = []
    for date_key, messages in chats.items():
        first_message = messages[-1]
        chat_list.append({
            'id': date_key,
            'title': first_message['message'][:50] + ('...' if len(first_message['message']) > 50 else ''),
            'date': date_key,
            'message_count': len(messages),
            'last_updated': messages[0]['created_at']
        })
    chat_list.sort(key=lambda x: x['last_updated'], reverse=True)
    return Response({'chats': chat_list, 'total': len(chat_list)}, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def ai_chat_messages(request, chat_id):
    try:
        user_profile = request.user.profile
        date_obj = datetime.strptime(chat_id, '%Y-%m-%d').date()
        interactions = AIInteraction.objects.filter(user=user_profile, created_at__date=date_obj).order_by('created_at')
        messages = []
        for interaction in interactions:
            messages.append({
                'id': interaction.id,
                'message': interaction.message,
                'response': interaction.response,
                'created_at': interaction.created_at.isoformat(),
            })
        return Response({'chat_id': chat_id, 'messages': messages}, status=status.HTTP_200_OK)
    except (UserProfile.DoesNotExist, ValueError):
        return Response({'error': 'Hata oluştu.'}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def ai_chat(request):
    try:
        user_profile = request.user.profile
    except UserProfile.DoesNotExist:
        return Response({'error': 'Kullanıcının profili yok.'}, status=status.HTTP_400_BAD_REQUEST)

    message = request.data.get('message')
    interaction_type = request.data.get('interaction_type', 'general')
    if not message:
        return Response({'error': 'message gereklidir.'}, status=status.HTTP_400_BAD_REQUEST)

    history = AIInteraction.objects.filter(user=user_profile).order_by('-created_at')[:10]
    history = list(reversed(history))

    # RAG
    rag_items = []
    try:
        rag_items = rag_search(user_profile.id, message, k=5)
    except Exception:
        pass
    rag_context = rag_build_ctx(rag_items, limit_chars=800)
    system_prompt = (
        "Sen samimi, bilgili ve motive edici bir diyetisyensin (Prona AI). "
        "Kullanıcıyla konuşurken emojiler kullan ve kısa cevaplar ver.\n\n"
        f"Kullanıcı Özeti: {user_profile.age} yaş, Hedef: {user_profile.get_goal_display()}, "
        f"Günlük Limit: {user_profile.daily_calorie_need} kcal.\n\n"
        "ÖNEMLİ GÖREV: Eğer kullanıcı bir şey yediğini söylerse:\n"
        "1. Yenen yiyecekleri ayır ve her birini ayrı ayrı analiz et.\n"
        "2. Tahmini kalorilerini ve makrolarını hesapla.\n"
        "3. Veriyi MUTLAKA bir JSON LİSTESİ [...] formatında döndür.\n"
        "---DATA_START---"
        "["
        "  {"
        '    "food_name": "Yemeğin Adı", '
        '    "calories": 120.5, '
        '    "protein": 10, '
        '    "carbs": 15, '
        '    "fat": 5, '
        '    "meal_time": "snack" '
        "  }"
        "]"
        "---DATA_END---"
        "\nNot: Tek bir yemek bile olsa köşeli parantez [...] içinde liste olarak gönder. "
        "meal_time alanı için saati tahmin et: 'breakfast', 'lunch', 'dinner' veya 'snack' yaz."
    )

    messages = [{"role": "system", "content": system_prompt}]
    if rag_context:
        messages.append({"role": "system", "content": f"Geçmiş:\n{rag_context}"})
    for h in history[-5:]:
        messages.append({"role": "user", "content": h.message[:200]})
        messages.append({"role": "assistant", "content": h.response[:300]})
    messages.append({"role": "user", "content": message})

    ai_reply = None
    try:
        if not OPENROUTER_KEY or not OPENROUTER_MODEL:
            ai_reply = "AI yapılandırması eksik."
        else:
            url = "https://openrouter.ai/api/v1/chat/completions"
            headers = {"Authorization": f"Bearer {OPENROUTER_KEY}", "Content-Type": "application/json"}
            payload = {"model": OPENROUTER_MODEL, "messages": messages, "max_tokens": 300, "temperature": 0.7}
            response = requests.post(url, headers=headers, json=payload, timeout=20)
            if response.status_code == 200:
                ai_reply = response.json()["choices"][0]["message"]["content"]
            else:
                return Response({'error': response.text}, status=status.HTTP_502_BAD_GATEWAY)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_502_BAD_GATEWAY)

    saved = AIInteraction.objects.create(
        user=user_profile, message=message, response=ai_reply or "", interaction_type=interaction_type
    )
    try:
        rag_add(user_profile.id, message, ai_reply or "", message_id=saved.id)
    except Exception:
        pass

    return Response({'message': message, 'response': ai_reply}, status=status.HTTP_200_OK)


# ScannedFood Views (Basitleştirildi)
class ScannedFoodListView(generics.ListCreateAPIView):
    serializer_class = ScannedFoodSerializer
    permission_classes = [permissions.IsAuthenticated]
    def get_queryset(self): return ScannedFood.objects.filter(user=self.request.user.profile)
    def perform_create(self, serializer): serializer.save(user=self.request.user.profile)

class ScannedFoodDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ScannedFoodSerializer
    permission_classes = [permissions.IsAuthenticated]
    def get_queryset(self): return ScannedFood.objects.filter(user=self.request.user.profile)


@api_view(['GET', 'POST'])
@permission_classes([permissions.IsAuthenticated])
def dashboard_stats(request):
    user_profile = request.user.profile
    user_input = request.data.get("message") if request.method == 'POST' else request.query_params.get("message")
    
    today = date.today()
    today_intake = DailyIntake.objects.filter(user=user_profile, date=today).first()
    
    # (AI Suggestion kısmı burada kısaltıldı, aynı mantık)
    return Response({
        "today_calories": today_intake.total_calories if today_intake else 0,
        "daily_need": user_profile.daily_calorie_need,
        "bmi": user_profile.bmi,
        "goal": user_profile.get_goal_display(),
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def weekly_report(request):
    user_profile = request.user.profile
    today = date.today()
    week_ago = today - timedelta(days=7)
    intakes = DailyIntake.objects.filter(user=user_profile, date__gte=week_ago).order_by('date')
    
    data = []
    for intake in intakes:
        data.append({
            'date': intake.date,
            'calories': intake.total_calories,
            'protein': intake.total_protein,
            'carbs': intake.total_carbs,
            'fat': intake.total_fat,
        })
    
    return Response({'weekly_data': data})


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def add_meal_to_daily_intake(request):
    user_profile = request.user.profile
    # (Standart ekleme işlemi)
    # Burayı zaten MealCreateSerializer yapıyor, ekstra bir view'a gerek yok ama korudum
    return Response({'status': 'ok'}, status=status.HTTP_200_OK)


# --- PLAN YÖNETİMİ ---
class CustomPlanFoodListView(generics.ListCreateAPIView):
    serializer_class = CustomPlanFoodSerializer
    permission_classes = [permissions.IsAuthenticated]
    def get_queryset(self):
        plan_id = self.kwargs.get('plan_id')
        return CustomPlanFood.objects.filter(custom_plan__id=plan_id, custom_plan__user=self.request.user.profile)
    def perform_create(self, serializer):
        plan = CustomPlan.objects.get(id=self.kwargs.get('plan_id'), user=self.request.user.profile)
        serializer.save(custom_plan=plan)

class CustomPlanFoodDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = CustomPlanFoodSerializer
    permission_classes = [permissions.IsAuthenticated]
    def get_queryset(self):
        plan_id = self.kwargs.get('plan_id')
        return CustomPlanFood.objects.filter(custom_plan__id=plan_id, custom_plan__user=self.request.user.profile)

# --- AI MEAL CREATION (CRITICAL FIX) ---
from django.db.models import Sum, F
from rest_framework.decorators import api_view, permission_classes
from rest_framework import permissions, status
from rest_framework.response import Response
from datetime import date, datetime
from .models import DailyIntake, Food, Meal  # Modellerinin yeri farklıysa burayı düzelt
# clean_number fonksiyonunun import edildiğini veya tanımlı olduğunu varsayıyorum

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def create_meal_from_ai(request):
    """
    AI'dan gelen hem tekli hem çoklu yemek verisini işler.
    """
    try:
        user_profile = request.user.profile
        
        # 1. Ortak Bilgileri Al
        meal_time = request.data.get('meal_time', 'snack')
        date_param = request.data.get('date', date.today())

        try:
            if isinstance(date_param, str):
                date_obj = datetime.strptime(date_param, '%Y-%m-%d').date()
            else:
                date_obj = date_param
        except ValueError:
            date_obj = date.today()

        # 2. Günlük Raporu (DailyIntake) Hazırla
        daily_intake, _ = DailyIntake.objects.get_or_create(
            user=user_profile,
            date=date_obj,
            defaults={'total_calories': 0}
        )

        # --- KRİTİK DÜZELTME BAŞLANGICI ---
        # Önce 'foods' listesi var mı diye bakıyoruz
        yemek_listesi = request.data.get('foods', [])

        # Eğer liste boşsa AMA tek bir yemek ismi geldiyse, onu listeye çeviriyoruz
        if not yemek_listesi and request.data.get('food_name'):
            yemek_listesi = [request.data]
        # --- KRİTİK DÜZELTME BİTİŞİ ---

        # 3. Döngü (Artık her türlü çalışır)
        for yemek in yemek_listesi:
            isim = yemek.get('food_name', '').strip().title()[:99]
            if not isim: continue 

            calories = clean_number(yemek.get('calories'))
            protein = clean_number(yemek.get('protein'))
            carbs = clean_number(yemek.get('carbs'))
            fat = clean_number(yemek.get('fat'))
            quantity = clean_number(yemek.get('quantity'))
            
            if quantity <= 0: quantity = 1.0

            food, created_food = Food.objects.get_or_create(
                name__iexact=isim,
                defaults={
                    'name': isim,
                    'calories': calories,
                    'protein': protein,
                    'carbs': carbs,
                    'fat': fat,
                    'category': 'snack' 
                }
            )
            
            if not created_food and food.calories == 0 and calories > 0:
                food.calories = calories
                food.protein = protein
                food.carbs = carbs
                food.fat = fat
                food.save()

            Meal.objects.create(
                daily_intake=daily_intake, 
                food=food,
                quantity=quantity,
                meal_time=meal_time, 
                notes='AI Chat Önerisi'
            )

        # 4. Toplamları Hesapla
        meals_qs = Meal.objects.filter(daily_intake=daily_intake)

        def calc_total(field):
            total = meals_qs.annotate(
                val=F(f'food__{field}') * F('quantity')
            ).aggregate(Sum('val'))['val__sum']
            return float(total) if total else 0.0

        daily_intake.total_calories = calc_total('calories')
        daily_intake.total_protein = calc_total('protein')
        daily_intake.total_carbs = calc_total('carbs')
        daily_intake.total_fat = calc_total('fat')
        daily_intake.save()

        return Response({
            'message': 'Yemekler başarıyla eklendi.',
            'daily_total': {
                'calories': daily_intake.total_calories,
                'protein': daily_intake.total_protein,
                'carbs': daily_intake.total_carbs,
                'fat': daily_intake.total_fat
            }
        }, status=status.HTTP_201_CREATED)

    except Exception as e:
        import traceback
        traceback.print_exc()
        return Response({'error': f'Sunucu hatası: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def add_meal_to_daily_intake(request):
    """
    Manuel olarak seçilen bir yemeği (ID ile) kaydeder.
    """
    try:
        user_profile = request.user.profile
        
        # 1. Frontend'den gelen verileri al
        food_id = request.data.get('food_id')
        quantity = clean_number(request.data.get('quantity'))
        meal_time = request.data.get('meal_time', 'snack')
        date_param = request.data.get('date', date.today())

        if not food_id:
            return Response({'error': 'Yemek seçilmedi.'}, status=status.HTTP_400_BAD_REQUEST)

        # Tarih formatını ayarla
        try:
            if isinstance(date_param, str):
                date_obj = datetime.strptime(date_param, '%Y-%m-%d').date()
            else:
                date_obj = date_param
        except ValueError:
            date_obj = date.today()

        # 2. Seçilen Yemeği Bul
        try:
            food = Food.objects.get(id=food_id)
        except Food.DoesNotExist:
            return Response({'error': 'Seçilen yemek bulunamadı.'}, status=status.HTTP_404_NOT_FOUND)

        # 3. Günlük Raporu (DailyIntake) Getir veya Oluştur
        daily_intake, _ = DailyIntake.objects.get_or_create(
            user=user_profile,
            date=date_obj,
            defaults={'total_calories': 0}
        )

        # 4. Öğünü Kaydet
        meal = Meal.objects.create(
            daily_intake=daily_intake,
            food=food,
            quantity=quantity,
            meal_time=meal_time,
            notes='Manuel Ekleme'
        )

        # 5. Toplamları Güncelle (Aggregation)
        meals_qs = Meal.objects.filter(daily_intake=daily_intake)

        def calc_total(field):
            total = meals_qs.annotate(
                val=F(f'food__{field}') * F('quantity')
            ).aggregate(Sum('val'))['val__sum']
            return float(total) if total else 0.0

        daily_intake.total_calories = calc_total('calories')
        daily_intake.total_protein = calc_total('protein')
        daily_intake.total_carbs = calc_total('carbs')
        daily_intake.total_fat = calc_total('fat')
        daily_intake.save()

        return Response({'message': 'Öğün başarıyla eklendi.'}, status=status.HTTP_201_CREATED)

    except Exception as e:
        import traceback
        traceback.print_exc()
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def analyze_food_image(request):
    """
    Frontend'den gelen besin etiketi resmini OpenRouter Vision modeline gönderir
    ve etiket üzerindeki besin değerlerini JSON olarak alır.
    """
    if 'image' not in request.FILES:
        return Response({'error': 'Resim yüklenmedi.'}, status=status.HTTP_400_BAD_REQUEST)

    image_file = request.FILES['image']
    
    # 1. Resmi Base64 formatına çevir
    try:
        base64_image = base64.b64encode(image_file.read()).decode('utf-8')
    except Exception as e:
        return Response({'error': f'Resim işlenemedi: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)

    # 2. OpenRouter İsteği Hazırla
    if not OPENROUTER_KEY:
        return Response({'error': 'API anahtarı eksik.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    url = "https://openrouter.ai/api/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {OPENROUTER_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://diyetuygulamasi.com", 
    }

    # Model alternatifleri: google/gemini-flash-1.5, openai/gpt-4o-mini, google/gemini-pro-vision
    model_name = OPENROUTER_MODEL if OPENROUTER_MODEL else "google/gemini-flash-1.5"
    
    payload = {
        "model": model_name,
        "messages": [
            {
                "role": "user",
                "content": [
                    {
                        "type": "text", 
                        "text": (
                            "Bu resimde bir besin etiketi var. Etiket üzerindeki besin değerlerini oku ve çıkar. "
                            "Etiket üzerinde genellikle şunlar yazar: "
                            "- Besin adı (ör: 'Süt', 'Ekmek', 'Yoğurt') "
                            "- 100 gram veya 100ml için besin değerleri: "
                            "  * Enerji/Kalori (kcal veya kJ) "
                            "  * Protein (g) "
                            "  * Karbonhidrat (g) "
                            "  * Yağ (g) "
                            "- Porsiyon bilgisi (ör: 1 porsiyon = 200g) "
                            "\n"
                            "Etiket üzerindeki TÜM metinleri oku ve aşağıdaki JSON formatında yanıt ver: "
                            "{\"food_name\": \"etiket üzerindeki besin adı\", "
                            "\"calories\": 100 gram için kalori değeri (sadece sayı), "
                            "\"protein\": 100 gram için protein değeri (sadece sayı, gram cinsinden), "
                            "\"carbs\": 100 gram için karbonhidrat değeri (sadece sayı, gram cinsinden), "
                            "\"fat\": 100 gram için yağ değeri (sadece sayı, gram cinsinden), "
                            "\"serving_size\": \"porsiyon bilgisi varsa (ör: 200g veya 250ml), yoksa null\"} "
                            "\n"
                            "ÖNEMLİ: "
                            "- Sadece etiket üzerinde yazan değerleri kullan, tahmin yapma. "
                            "- Eğer bir değer etikette yoksa 0 yaz. "
                            "- Kalori değeri kJ cinsindeyse, kcal'e çevir (1 kcal = 4.184 kJ). "
                            "- Sadece JSON döndür, başka açıklama yapma. "
                            "- JSON formatında döndür, markdown kullanma."
                        )
                    },
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/jpeg;base64,{base64_image}"
                        }
                    }
                ]
            }
        ],
        "max_tokens": 500,
        "temperature": 0.1  # Düşük temperature = daha tutarlı sonuçlar
    }

    try:
        response = requests.post(url, headers=headers, json=payload, timeout=30)
        
        if response.status_code == 200:
            ai_content = response.json()['choices'][0]['message']['content']
            
            # Markdown temizliği (```json ... ``` kısımlarını siler)
            cleaned_json = ai_content.replace("```json", "").replace("```", "").strip()
            
            # Eğer başında/tırında tırnak işareti varsa temizle
            if cleaned_json.startswith('"'):
                cleaned_json = cleaned_json[1:]
            if cleaned_json.endswith('"'):
                cleaned_json = cleaned_json[:-1]
            cleaned_json = cleaned_json.strip()
            
            import json
            try:
                data = json.loads(cleaned_json)
                
                # Veri doğrulama ve temizleme
                if not isinstance(data, dict):
                    return Response({'error': 'Geçersiz veri formatı.'}, status=status.HTTP_400_BAD_REQUEST)
                
                # Sayısal değerleri kontrol et ve temizle
                result = {
                    'food_name': data.get('food_name', 'Bilinmeyen Besin'),
                    'calories': float(data.get('calories', 0)) if data.get('calories') else 0,
                    'protein': float(data.get('protein', 0)) if data.get('protein') else 0,
                    'carbs': float(data.get('carbs', 0)) if data.get('carbs') else 0,
                    'fat': float(data.get('fat', 0)) if data.get('fat') else 0,
                }
                
                return Response({'status': 'success', 'data': result}, status=status.HTTP_200_OK)
            except json.JSONDecodeError as e:
                return Response({
                    'error': f'JSON parse hatası: {str(e)}. AI yanıtı: {cleaned_json[:200]}'
                }, status=status.HTTP_400_BAD_REQUEST)
        else:
            error_text = response.text
            try:
                error_json = response.json()
                error_text = str(error_json)
            except:
                pass
            return Response({'error': f'AI Hatası: {error_text}'}, status=status.HTTP_502_BAD_GATEWAY)

    except Exception as e:
        import traceback
        traceback.print_exc()
        return Response({'error': f'Sunucu hatası: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)