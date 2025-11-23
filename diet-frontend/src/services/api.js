// src/services/api.js
import axios from 'axios';

// 🚨 Kendi backend adresiniz
const API_BASE_URL = 'http://localhost:8000/api'; 

// 1. TEK VE MERKEZİ AXIOS INSTANCE OLUŞTURUYORUZ
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// 2. REQUEST INTERCEPTOR (İstek Atılmadan Önce)
// Her isteğe otomatik olarak Token ekler. Artık her fonksiyonda manuel eklemene gerek yok.
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('userToken'); // Senin kullandığın key: 'userToken'
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// 3. RESPONSE INTERCEPTOR (Cevap Döndükten Sonra - KRİTİK KISIM)
// Backend'den hata dönerse burası yakalar.
api.interceptors.response.use(
    (response) => response, // Başarılıysa devam et
    (error) => {
        // Eğer 401 (Yetkisiz) hatası gelirse (Token süresi dolmuş veya geçersiz)
        if (error.response && error.response.status === 401) {
            console.warn('Oturum süresi doldu, giriş sayfasına yönlendiriliyor...');
            
            // Token'ı sil
            localStorage.removeItem('userToken');

            // Kullanıcıyı Login sayfasına at (Sayfayı yenileyerek state'i temizler)
            // Eğer Login sayfanın yolu '/giris' ise burayı değiştir.
            window.location.href = '/login'; 
        }
        return Promise.reject(error);
    }
);

// --- API FONKSİYONLARI (Artık çok daha sade) ---

// Kayıt Fonksiyonu
export const registerUser = async (userData) => {
    const response = await api.post('/auth/register/', userData); 
    return response.data; 
};

// Profil güncelleme
export const createUserProfile = async (profileData) => {
    // Interceptor token'ı otomatik ekleyeceği için burada manuel token kontrolüne gerek kalmadı.
    const response = await api.put('/auth/profile/', profileData);
    return response.data;
};

// Hesap silme
export const deleteUserAccount = async () => {
    const response = await api.delete('/auth/delete-account/');
    localStorage.removeItem('userToken');
    return response.data;
};

// Giriş Fonksiyonu
export const loginUser = async (credentials) => {
    const response = await api.post('/auth/login/', credentials);
    // Token yapına göre burayı ayarladım
    const token = response.data.tokens?.access || response.data.access;
    return token;
};

// Kullanıcı profilini getir
export const getUserProfile = async () => {
    const response = await api.get('/auth/profile/');
    return response.data;
};

// Diyet planlarını getir
export const getCustomPlans = async () => {
    const response = await api.get('/auth/custom-plans/');
    return response.data;
};

// Sohbet mesajı gönder
export const sendChatMessage = async (message) => {
    const response = await api.post('/auth/ai-chat/', { message });
    return response.data;
};

// Geçmiş sohbetleri getir
export const getChatHistory = async () => {
    const response = await api.get('/auth/ai-chat/history/');
    return response.data;
};

// Sohbet detayını getir
export const getChatMessages = async (chatId) => {
    const response = await api.get(`/auth/ai-chat/messages/${chatId}/`);
    return response.data;
};

// Dashboard
export const getDashboard = async () => {
    const response = await api.get('/auth/dashboard/');
    return response.data;
};

// Öğünleri getir
export const getMeals = async (date) => {
    const response = await api.get(`/auth/meals/?date=${encodeURIComponent(date)}`);
    return response.data;
};

// Öğün ekle
export const addMeal = async ({ food_id, quantity, meal_time = 'snack', notes = '', date }) => {
    const payload = { food_id, quantity, meal_time, notes, date };
    const response = await api.post('/auth/add-meal/', payload);
    return response.data;
};

// Yiyecek arama
export const searchFoods = async (search) => {
    const response = await api.get(`/auth/foods/?search=${encodeURIComponent(search)}&ordering=name`);
    return response.data;
};

export default api;