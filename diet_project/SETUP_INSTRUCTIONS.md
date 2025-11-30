# Diet Project Kurulum ve Çalıştırma Talimatları

## 1. Virtual Environment Aktifleştirme

### Windows (PowerShell):
```powershell
cd diet_project
.\venv\Scripts\Activate.ps1
```

### Windows (Command Prompt):
```cmd
cd diet_project
venv\Scripts\activate.bat
```

## 2. Gerekli Paketlerin Yüklenmesi

```bash
pip install -r requirements.txt
```

## 3. Veritabanı Migrasyonları

```bash
python manage.py makemigrations
python manage.py migrate
```

## 4. Süper Kullanıcı Oluşturma (Opsiyonel)

```bash
python manage.py createsuperuser
```

## 5. Test Verileri Oluşturma (Opsiyonel)

```bash
python manage.py shell
```

Python shell'de:
```python
from users.models import Food, User, UserProfile
from django.contrib.auth.models import User

# Test kullanıcısı oluştur
user = User.objects.create_user(
    username='testuser',
    email='test@example.com',
    password='testpass123'
)

# Profil oluştur
profile = UserProfile.objects.create(
    user=user,
    age=25,
    weight=70,
    height=175,
    goal='lose_weight',
    activity_level='moderate'
)

# Test yiyecekleri oluştur
foods_data = [
    {'name': 'Elma', 'calories': 52, 'protein': 0.3, 'carbs': 14, 'fat': 0.2, 'category': 'fruit'},
    {'name': 'Tavuk Göğsü', 'calories': 165, 'protein': 31, 'carbs': 0, 'fat': 3.6, 'category': 'protein'},
    {'name': 'Pirinç', 'calories': 130, 'protein': 2.7, 'carbs': 28, 'fat': 0.3, 'category': 'carb'},
    {'name': 'Yumurta', 'calories': 155, 'protein': 13, 'carbs': 1.1, 'fat': 11, 'category': 'protein'},
    {'name': 'Muz', 'calories': 89, 'protein': 1.1, 'carbs': 23, 'fat': 0.3, 'category': 'fruit'},
    {'name': 'Ekmek', 'calories': 265, 'protein': 9, 'carbs': 49, 'fat': 3.2, 'category': 'carb'},
    {'name': 'Süt', 'calories': 42, 'protein': 3.4, 'carbs': 5, 'fat': 1, 'category': 'beverage'},
    {'name': 'Brokoli', 'calories': 34, 'protein': 2.8, 'carbs': 7, 'fat': 0.4, 'category': 'vegetable'},
]

for food_data in foods_data:
    Food.objects.create(**food_data)

print("Test verileri oluşturuldu!")
exit()
```

## 6. Sunucuyu Başlatma

```bash
python manage.py runserver
```

Sunucu `http://127.0.0.1:8000/` adresinde çalışacak.

## 7. API Test Etme

### Postman veya curl ile test:

#### Kullanıcı Kayıt:
```bash
curl -X POST http://127.0.0.1:8000/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "testpass123",
    "password_confirm": "testpass123",
    "first_name": "Test",
    "last_name": "User"
  }'
```

#### Giriş Yap:
```bash
curl -X POST http://127.0.0.1:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "testpass123"
  }'
```

#### Besin Arama:
```bash
curl -X GET "http://127.0.0.1:8000/api/auth/foods/?search=elma" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## 8. Test Çalıştırma

```bash
python manage.py test users.tests
```

## 9. Admin Panel

Admin paneline erişim: `http://127.0.0.1:8000/admin/`

## 10. API Dokümantasyonu

Tüm endpoint'ler için detaylı dokümantasyon: `API_ENDPOINTS.md` dosyasına bakın.

## Önemli Notlar

1. **Virtual Environment**: Her zaman virtual environment'ı aktifleştirin
2. **Database**: İlk çalıştırmada migrations yapın
3. **Token**: API kullanımı için JWT token gerekli
4. **CORS**: Frontend ile çalışırken CORS ayarları gerekebilir

## Sorun Giderme

### Import Hatası:
```bash
pip install django djangorestframework djangorestframework-simplejwt psycopg2-binary
```

### Migration Hatası:
```bash
python manage.py makemigrations users
python manage.py migrate
```

### Port Kullanımda:
```bash
python manage.py runserver 8001
```











