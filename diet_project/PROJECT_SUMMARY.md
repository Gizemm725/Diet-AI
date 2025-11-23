# Diet Project - Proje Özeti

## 🎯 Proje Amacı
Kullanıcıların günlük kalori takibi yapabileceği, besin arama özelliği olan ve AI destekli diyet planı oluşturabileceği bir Django REST API projesi.

## ✅ Tamamlanan Özellikler

### 1. Kullanıcı Yönetimi
- ✅ Kullanıcı kayıt/giriş sistemi
- ✅ JWT token tabanlı kimlik doğrulama
- ✅ Kullanıcı profil yönetimi
- ✅ BMI ve günlük kalori ihtiyacı hesaplama

### 2. Besin Arama Sistemi
- ✅ Gelişmiş besin arama (isim, kategori, kalori, makro besinler)
- ✅ Filtreleme seçenekleri (kalori aralığı, protein, karbonhidrat, yağ)
- ✅ Sıralama seçenekleri
- ✅ Besin detay bilgileri

### 3. Diyet Planı Yönetimi
- ✅ Özel diyet planı oluşturma
- ✅ Plan'a yiyecek ekleme/çıkarma
- ✅ Plan aktifleştirme
- ✅ Plan önerileri (hedefe göre)
- ✅ Plan detayları ve toplam besin değerleri

### 4. Günlük Kalori Takibi
- ✅ Günlük öğün ekleme
- ✅ Otomatik kalori hesaplama
- ✅ Makro besin takibi (protein, karbonhidrat, yağ)
- ✅ Günlük/haftalık raporlar

### 5. Dashboard ve Raporlar
- ✅ Dashboard istatistikleri
- ✅ Haftalık kalori raporu
- ✅ BMI ve hedef takibi

### 6. Test Sistemi
- ✅ Kapsamlı unit testler
- ✅ API endpoint testleri
- ✅ Model testleri
- ✅ Authentication testleri

## 🏗️ Teknik Yapı

### Backend Teknolojileri
- **Django 5.2.7**: Web framework
- **Django REST Framework**: API geliştirme
- **JWT**: Token tabanlı kimlik doğrulama
- **PostgreSQL**: Veritabanı (psycopg2)

### Model Yapısı
```
UserProfile (Kullanıcı Profili)
├── BMI hesaplama
├── Günlük kalori ihtiyacı
└── Hedef ve aktivite seviyesi

Food (Besin)
├── Besin bilgileri
├── Makro besinler
└── Kategori sistemi

CustomPlan (Diyet Planı)
├── Plan yönetimi
├── Aktif plan sistemi
└── Plan önerileri

CustomPlanFood (Plan Yiyecekleri)
├── Plan-yiyecek ilişkisi
├── Miktar ve öğün zamanı
└── Sıralama

DailyIntake (Günlük Takip)
├── Günlük kalori toplamı
├── Makro besin toplamları
└── Otomatik güncelleme

Meal (Öğün)
├── Yiyecek-miktar ilişkisi
├── Otomatik kalori hesaplama
└── Öğün zamanı takibi
```

## 📊 API Endpoint'leri

### Kimlik Doğrulama
- `POST /api/auth/register/` - Kullanıcı kayıt
- `POST /api/auth/login/` - Kullanıcı giriş
- `POST /api/auth/token/refresh/` - Token yenileme

### Besin Arama
- `GET /api/auth/foods/` - Besin listesi (filtreleme ile)
- `GET /api/auth/foods/{id}/` - Besin detayı

### Diyet Planı
- `GET /api/auth/custom-plans/` - Plan listesi
- `POST /api/auth/custom-plans/` - Plan oluşturma
- `GET /api/auth/custom-plans/{id}/` - Plan detayı
- `PUT /api/auth/custom-plans/{id}/` - Plan güncelleme
- `DELETE /api/auth/custom-plans/{id}/` - Plan silme

### Plan Yiyecek Yönetimi
- `GET /api/auth/custom-plans/{plan_id}/foods/` - Plan yiyecekleri
- `POST /api/auth/custom-plans/{plan_id}/add-food/` - Yiyecek ekleme
- `DELETE /api/auth/custom-plans/{plan_id}/remove-food/{food_id}/` - Yiyecek çıkarma
- `POST /api/auth/custom-plans/{plan_id}/activate/` - Plan aktifleştirme
- `GET /api/auth/plan-recommendations/` - Plan önerileri

### Günlük Takip
- `GET /api/auth/daily-intakes/` - Günlük takip listesi
- `POST /api/auth/daily-intakes/` - Günlük takip oluşturma
- `POST /api/auth/add-meal/` - Öğün ekleme

### Dashboard
- `GET /api/auth/dashboard/` - Dashboard istatistikleri
- `GET /api/auth/weekly-report/` - Haftalık rapor

## 🧪 Test Kapsamı

### Test Sınıfları
1. **UserAuthenticationTests**: Kimlik doğrulama testleri
2. **FoodSearchTests**: Besin arama testleri
3. **CustomPlanTests**: Diyet planı testleri
4. **DailyIntakeTests**: Günlük takip testleri
5. **DashboardTests**: Dashboard testleri
6. **ModelTests**: Model testleri

### Test Senaryoları
- ✅ Kullanıcı kayıt/giriş
- ✅ Besin arama ve filtreleme
- ✅ Diyet planı CRUD işlemleri
- ✅ Plan yiyecek yönetimi
- ✅ Günlük kalori takibi
- ✅ Dashboard ve raporlar
- ✅ Model hesaplamaları

## 🚀 Gelecek Özellikler

### Planlanan Geliştirmeler
- [ ] AI agent entegrasyonu
- [ ] OCR ile besin tanıma
- [ ] Mobil uygulama
- [ ] Sosyal özellikler
- [ ] Besin veritabanı genişletme
- [ ] Gelişmiş raporlama

## 📁 Proje Yapısı

```
diet_project/
├── diet_backend/          # Django proje ayarları
├── users/                 # Ana uygulama
│   ├── models.py         # Veritabanı modelleri
│   ├── serializers.py    # API serializers
│   ├── views.py          # API view'ları
│   ├── urls.py           # URL routing
│   └── tests.py          # Test dosyaları
├── venv/                  # Virtual environment
├── requirements.txt       # Python paketleri
├── API_ENDPOINTS.md      # API dokümantasyonu
├── SETUP_INSTRUCTIONS.md # Kurulum talimatları
└── PROJECT_SUMMARY.md    # Bu dosya
```

## 🎉 Sonuç

Proje başarıyla tamamlanmıştır! Tüm temel özellikler implement edilmiş, kapsamlı testler yazılmış ve API dokümantasyonu hazırlanmıştır. Proje production'a hazır durumda ve gelecek geliştirmeler için sağlam bir temel oluşturmuştur.








