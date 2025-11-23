# Django Diet Tracking API Documentation

Bu proje Django REST Framework ve JWT (JSON Web Token) kullanarak kişiselleştirilmiş diyet takip sistemi içerir.

## Kurulum ve Çalıştırma

1. Sanal ortamı aktifleştirin:
```bash
.\venv\Scripts\Activate.ps1
```

2. Sunucuyu başlatın:
```bash
python manage.py runserver
```

## API Endpoints

### Authentication Endpoints

### 1. Kullanıcı Kayıt (Register)
**POST** `/api/auth/register/`

**Request Body:**
```json
{
    "username": "kullanici_adi",
    "email": "email@example.com",
    "first_name": "Ad",
    "last_name": "Soyad",
    "password": "sifre123",
    "password_confirm": "sifre123"
}
```

**Response:**
```json
{
    "message": "Kullanıcı başarıyla oluşturuldu.",
    "user": {
        "id": 1,
        "username": "kullanici_adi",
        "email": "email@example.com",
        "first_name": "Ad",
        "last_name": "Soyad"
    },
    "tokens": {
        "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
        "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
    }
}
```

### 2. Kullanıcı Giriş (Login)
**POST** `/api/auth/login/`

**Request Body:**
```json
{
    "username": "kullanici_adi",
    "password": "sifre123"
}
```

**Response:**
```json
{
    "message": "Giriş başarılı.",
    "user": {
        "id": 1,
        "username": "kullanici_adi",
        "email": "email@example.com",
        "first_name": "Ad",
        "last_name": "Soyad"
    },
    "tokens": {
        "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
        "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
    }
}
```

### 3. Token Yenileme (Refresh Token)
**POST** `/api/auth/token/refresh/`

**Request Body:**
```json
{
    "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

**Response:**
```json
{
    "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

### 4. Kullanıcı Çıkış (Logout)
**POST** `/api/auth/logout/`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
    "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

**Response:**
```json
{
    "message": "Çıkış başarılı."
}
```

### 5. Kullanıcı Profili (Profile)
**GET** `/api/auth/profile/`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
    "id": 1,
    "username": "kullanici_adi",
    "email": "email@example.com",
    "first_name": "Ad",
    "last_name": "Soyad",
    "date_joined": "2025-01-19T10:00:00Z",
    "last_login": "2025-01-19T10:30:00Z"
}
```

### 6. Kullanıcı Bilgileri (Info)
**GET** `/api/auth/info/`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
    "id": 1,
    "username": "kullanici_adi",
    "email": "email@example.com",
    "first_name": "Ad",
    "last_name": "Soyad",
    "date_joined": "2025-01-19T10:00:00Z",
    "last_login": "2025-01-19T10:30:00Z"
}
```

### 7. Şifre Değiştirme (Change Password)
**POST** `/api/auth/change-password/`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
    "old_password": "eski_sifre",
    "new_password": "yeni_sifre123"
}
```

**Response:**
```json
{
    "message": "Şifre başarıyla değiştirildi."
}
```

## Diet Tracking Endpoints

### 8. Kullanıcı Profil Detayları
**GET/PUT** `/api/auth/profile/`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
    "id": 1,
    "user": 1,
    "age": 25,
    "weight": 70.0,
    "height": 175.0,
    "goal": "lose_weight",
    "activity_level": "moderate",
    "bmi": 22.9,
    "daily_calorie_need": 2200,
    "created_at": "2025-01-19T10:00:00Z",
    "updated_at": "2025-01-19T10:30:00Z"
}
```

### 9. Dashboard İstatistikleri
**GET** `/api/auth/dashboard/`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
    "today_calories": 1800,
    "daily_need": 2200,
    "bmi": 22.9,
    "weekly_avg_calories": 1950.5,
    "goal": "Kilo Vermek",
    "activity_level": "Orta Aktif"
}
```

### 10. Yiyecek Listesi
**GET** `/api/auth/foods/`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `search`: Yiyecek adında arama
- `category`: Kategori filtresi (breakfast, lunch, dinner, snack, etc.)

**Response:**
```json
[
    {
        "id": 1,
        "name": "Yumurta",
        "calories": 155,
        "protein": 13.0,
        "carbs": 1.1,
        "fat": 11.0,
        "category": "breakfast",
        "serving_size": "100g"
    }
]
```

### 11. Günlük Takip Listesi
**GET** `/api/auth/daily-intakes/`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
[
    {
        "id": 1,
        "user": 1,
        "date": "2025-01-19",
        "total_calories": 1800.0,
        "total_protein": 120.0,
        "total_carbs": 200.0,
        "total_fat": 80.0,
        "meals": [
            {
                "id": 1,
                "food": 1,
                "quantity": 2.0,
                "calories": 310.0,
                "meal_time": "breakfast",
                "notes": "Kahvaltı"
            }
        ]
    }
]
```

### 12. Öğün Ekleme
**POST** `/api/auth/add-meal/`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
    "food_id": 1,
    "quantity": 2.0,
    "meal_time": "breakfast",
    "notes": "Kahvaltı",
    "date": "2025-01-19"
}
```

**Response:**
```json
{
    "id": 1,
    "daily_intake": 1,
    "food": 1,
    "quantity": 2.0,
    "calories": 310.0,
    "meal_time": "breakfast",
    "notes": "Kahvaltı",
    "created_at": "2025-01-19T10:00:00Z"
}
```

### 13. Haftalık Rapor
**GET** `/api/auth/weekly-report/`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
    "weekly_data": [
        {
            "date": "2025-01-13",
            "calories": 1800.0,
            "protein": 120.0,
            "carbs": 200.0,
            "fat": 80.0
        }
    ],
    "total_calories": 12600.0,
    "avg_calories": 1800.0
}
```

### 14. Özel Plan Oluşturma
**POST** `/api/auth/custom-plans/`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
    "name": "Haftalık Sporcu Planı",
    "description": "Sporcu beslenme planı",
    "is_active": true
}
```

### 15. AI Etkileşim
**POST** `/api/auth/ai-interactions/`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
    "message": "Bugün ne yemeliyim?",
    "interaction_type": "nutrition_advice"
}
```

### 16. Taranan Yiyecek Ekleme
**POST** `/api/auth/scanned-foods/`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
    "food_name": "Çikolata",
    "calories": 500.0,
    "confidence_score": 0.95,
    "image_path": "/uploads/scanned_food_123.jpg"
}
```

## Test Kullanıcısı

Test için oluşturulan admin kullanıcısı:
- **Username:** admin
- **Password:** admin123
- **Email:** admin@example.com

## Önemli Notlar

1. **Access Token** süresi: 60 dakika
2. **Refresh Token** süresi: 7 gün
3. Tüm korumalı endpoint'ler için `Authorization: Bearer <access_token>` header'ı gerekli
4. Logout işlemi refresh token'ı blacklist'e ekler
5. Şifre minimum 8 karakter olmalı

## Hata Kodları

- **400 Bad Request:** Geçersiz veri veya eksik alanlar
- **401 Unauthorized:** Geçersiz token veya kimlik doğrulama hatası
- **403 Forbidden:** Yetkisiz erişim
- **500 Internal Server Error:** Sunucu hatası

