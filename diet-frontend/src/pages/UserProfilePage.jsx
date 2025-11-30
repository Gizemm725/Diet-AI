import React, { useState, useEffect } from 'react';
import { User, Mail, Activity, Target, Calendar, Weight, Ruler, Edit2, Save, X, Loader2, LogOut } from 'lucide-react';
import axios from 'axios'; 
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar'; 
import avatarImg from '../assets/avatar.png'; 

const UserProfilePage = () => {
    const navigate = useNavigate();
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        first_name: '',
        last_name: '',
        age: '',
        weight: '',
        height: '',
        goal: 'maintain',
        activity_level: 'moderate',
        bmi: 0,
        daily_calorie_need: 0
    });

    const API_URL = 'http://127.0.0.1:8000/api/'; 
    
    const activityChoices = [
        { value: 'sedentary', label: 'Hareketsiz (Masa başı)' },
        { value: 'light', label: 'Hafif Aktif (Haftada 1-3 gün spor)' },
        { value: 'moderate', label: 'Orta Aktif (Haftada 3-5 gün spor)' },
        { value: 'active', label: 'Aktif (Haftada 6-7 gün spor)' },
        { value: 'very_active', label: 'Çok Aktif (Fiziksel iş/spor)' },
    ];

    const goalChoices = [
        { value: 'lose_weight', label: 'Kilo Vermek' },
        { value: 'maintain', label: 'Kilomu Korumak' },
        { value: 'gain_muscle', label: 'Kas Kazanmak' },
    ];

    const getAuthHeaders = () => {
        const token = localStorage.getItem('userToken'); 
        return {
            'Authorization': `Bearer ${token}`
        };
    };

    const loadMockData = () => {
        setFormData({
            username: 'test_kullanici',
            email: 'test@example.com',
            first_name: 'Test',
            last_name: 'Hesabı',
            age: 24,
            weight: 62.5,
            height: 168,
            goal: 'maintain',
            activity_level: 'moderate',
            bmi: 22.1,
            daily_calorie_need: 2150
        });
    };

    // VERİ ÇEKME
    const fetchProfile = async () => {
        const token = localStorage.getItem('userToken');
        if (!token) { loadMockData(); return; }

        try {
            const response = await axios.get(`${API_URL}profile/`, { headers: getAuthHeaders() });
            const data = response.data;
            const user = data.user || {}; 
            
            setFormData({
                first_name: data.first_name || user.first_name || '',
                last_name: data.last_name || user.last_name || '',
                username: data.username || user.username || 'Kullanıcı', 
                email: data.email || user.email || '', 
                age: data.age || 0,
                weight: data.weight || 0,
                height: data.height || 0,
                goal: data.goal || 'maintain',
                activity_level: data.activity_level || 'moderate',
                bmi: data.bmi ? parseFloat(data.bmi).toFixed(1) : 0,
                daily_calorie_need: data.daily_calorie_need || 0
            });

        } catch (error) {
            console.error("❌ API Hatası:", error);
            loadMockData(); 
        }
    };

    useEffect(() => {
        fetchProfile().then(() => setIsLoading(false));
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        if (name === 'age' || name === 'weight' || name === 'height') {
            const numValue = value === '' ? '' : (isNaN(value) ? formData[name] : value);
            setFormData((prev) => ({ ...prev, [name]: numValue }));
        } else {
            setFormData((prev) => ({ ...prev, [name]: value }));
        }
    };

    const handleEditClick = (e) => {
        if (e) { e.preventDefault(); e.stopPropagation(); }
        setIsEditing(true);
    };

    // KAYDETME
    const handleSave = async (e) => {
        if (e) { e.preventDefault(); e.stopPropagation(); }
        setIsLoading(true); 
        try {
            const token = localStorage.getItem('userToken'); 
            if (!token) { navigate('/login'); return; }
            
            const patchData = {
                age: formData.age === '' ? 0 : parseInt(formData.age) || 0,
                weight: formData.weight === '' ? 0 : parseFloat(formData.weight) || 0,
                height: formData.height === '' ? 0 : parseFloat(formData.height) || 0,
                goal: formData.goal || 'maintain',
                activity_level: formData.activity_level || 'moderate',
                username: formData.username || '',
                email: formData.email || '',
                first_name: formData.first_name || '',
                last_name: formData.last_name || '',
            };

            const response = await axios.patch(`${API_URL}profile/`, patchData, { headers: getAuthHeaders() });
            
            if (response.status === 200 || response.status === 201) {
                setIsEditing(false);
                await fetchProfile();
            } else {
                throw new Error('Kayıt başarısız');
            }
        } catch (error) {
            console.error("Kaydetme hatası:", error);
            alert("Kaydederken bir hata oluştu.");
            setIsEditing(true); 
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('userToken');
        window.location.href = '/';
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F7FBF9]">
                <Loader2 className="animate-spin text-[#6FCF97]" size={40} />
            </div>
        );
    }

    const findGoalLabel = (value) => goalChoices.find(g => g.value === value)?.label || value;
    const findActivityLabel = (value) => activityChoices.find(a => a.value === value)?.label || value;
    
    const getBmiStatus = (bmi) => {
        if (bmi === 0) return 'Hesaplanıyor';
        if (bmi < 18.5) return 'Zayıf';
        if (bmi < 25) return 'Normal';
        if (bmi < 30) return 'Fazla Kilo';
        return 'Obez';
    };

    return (
        <div className="flex min-h-screen bg-[#F8F9FA] font-sans dark:bg-gray-950">
            {/* 1. SIDEBAR */}
            <Sidebar />

            {/* 2. ANA İÇERİK */}
            <main className="flex-1 lg:ml-64 p-6 md:p-10 transition-all duration-300">
                
                {/* Header */}
                <header className="flex justify-between items-center mb-8">
                    <div className="flex items-center gap-4 ml-auto">
                        <button className="w-12 h-12 bg-white rounded-full border border-gray-100 flex items-center justify-center shadow-sm relative hover:bg-gray-50 dark:bg-gray-900 dark:border-gray-800">
                            🔔 <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-orange-500 rounded-full border-2 border-white"></span>
                        </button>
                        <div className="flex items-center gap-3 bg-white pl-2 pr-4 py-2 rounded-full border border-gray-100 shadow-sm dark:bg-gray-900 dark:border-gray-800">
                            <img src={avatarImg} alt="User" className="w-9 h-9 rounded-full object-cover border-2 border-green-100" />
                            <span className="text-sm font-bold text-gray-700 dark:text-gray-200">{formData.first_name || 'Kullanıcı'}</span>
                        </div>
                    </div>
                </header>

                <div className="max-w-5xl mx-auto">
                    
                    {/* Üst Profil Kartı (Avatar & İsim) */}
                    <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden mb-8 dark:bg-gray-900 dark:border-gray-800">
                        <div className="relative z-10">
                             <div className="w-32 h-32 rounded-full p-1 bg-gradient-to-tr from-[#6FCF97] to-orange-300">
                                <div className="w-full h-full rounded-full border-4 border-white bg-gray-100 overflow-hidden relative group">
                                    <img src={avatarImg} alt="Profile" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                        <User className="text-white" />
                                    </div>
                                </div>
                             </div>
                        </div>

                        <div className="flex-1 text-center md:text-left z-10 space-y-2">
                            {isEditing ? (
                                <div className="flex gap-2 justify-center md:justify-start">
                                    <input name="first_name" value={formData.first_name} onChange={handleInputChange} placeholder="Ad" className="p-2 border rounded-lg w-32 font-bold text-lg" />
                                    <input name="last_name" value={formData.last_name} onChange={handleInputChange} placeholder="Soyad" className="p-2 border rounded-lg w-32 font-bold text-lg" />
                                </div>
                            ) : (
                                <h1 className="text-3xl font-extrabold text-[#2F5E41] dark:text-[#A7F3D0]">
                                    {formData.first_name} {formData.last_name}
                                </h1>
                            )}
                            
                            <p className="text-gray-400 font-medium dark:text-gray-300">@{formData.username}</p>
                            
                            <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-4">
                                <span className="bg-orange-50 text-orange-600 px-4 py-1.5 rounded-full text-xs font-bold border border-orange-100 uppercase tracking-wide">
                                    {findGoalLabel(formData.goal)}
                                </span>
                                <span className="bg-green-50 text-[#6FCF97] px-4 py-1.5 rounded-full text-xs font-bold border border-green-100 uppercase tracking-wide">
                                    BMI: {formData.bmi}
                                </span>
                            </div>
                        </div>

                        {/* Düzenle Butonları */}
                        <div className="relative z-20 flex gap-3">
                            {!isEditing ? (
                                <button onClick={handleEditClick} className="flex items-center gap-2 px-6 py-3 bg-[#2F5E41] hover:bg-[#1e3d2a] text-white font-bold rounded-xl shadow-lg transition-transform hover:scale-105">
                                    <Edit2 size={18} /> <span>Düzenle</span>
                                </button>
                            ) : (
                                <>
                                    <button onClick={() => {setIsEditing(false); fetchProfile();}} className="p-3 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl transition-colors">
                                        <X size={20} />
                                    </button>
                                    <button onClick={handleSave} disabled={isLoading} className="flex items-center gap-2 px-6 py-3 bg-[#6FCF97] hover:bg-[#5dbb85] text-white font-bold rounded-xl shadow-lg transition-all">
                                        {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                                        <span>Kaydet</span>
                                    </button>
                                </>
                            )}
                        </div>
                        {/* Arka Plan Dekoru */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-green-50 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none dark:hidden"></div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        
                        {/* SOL KOLON (2 Span) */}
                        <div className="lg:col-span-2 space-y-8">
                            
                            {/* Kart 1: Fiziksel Bilgiler */}
                            <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100 dark:bg-gray-900 dark:border-gray-800">
                                <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-3 dark:text-gray-100">
                                    <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center"><Activity size={20} /></div>
                                    Fiziksel Ölçümler
                                </h2>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Kilo */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wide pl-1">Kilo (kg)</label>
                                        {isEditing ? (
                                            <div className="relative">
                                                <input type="number" name="weight" value={formData.weight || ''} onChange={handleInputChange} className="w-full p-4 bg-gray-50 border-2 border-transparent focus:bg-white focus:border-[#6FCF97] rounded-xl outline-none font-bold" />
                                                <Weight size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                            </div>
                                        ) : (
                                            <div className="text-3xl font-bold text-gray-800 dark:text-gray-100">{formData.weight} <span className="text-sm text-gray-400">kg</span></div>
                                        )}
                                    </div>

                                    {/* Boy */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wide pl-1">Boy (cm)</label>
                                        {isEditing ? (
                                            <div className="relative">
                                                <input type="number" name="height" value={formData.height || ''} onChange={handleInputChange} className="w-full p-4 bg-gray-50 border-2 border-transparent focus:bg-white focus:border-[#6FCF97] rounded-xl outline-none font-bold" />
                                                <Ruler size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                            </div>
                                        ) : (
                                            <div className="text-3xl font-bold text-gray-800 dark:text-gray-100">{formData.height} <span className="text-sm text-gray-400">cm</span></div>
                                        )}
                                    </div>

                                    {/* Yaş */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wide pl-1">Yaş</label>
                                        {isEditing ? (
                                            <div className="relative">
                                                <input type="number" name="age" value={formData.age || ''} onChange={handleInputChange} className="w-full p-4 bg-gray-50 border-2 border-transparent focus:bg-white focus:border-[#6FCF97] rounded-xl outline-none font-bold" />
                                                <Calendar size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                            </div>
                                        ) : (
                                            <div className="text-3xl font-bold text-gray-800 dark:text-gray-100">{formData.age}</div>
                                        )}
                                    </div>

                                    {/* BMI */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wide pl-1">Vücut Kitle İndeksi</label>
                                        <div className="flex items-center gap-3 p-3 bg-[#EBF7EE] rounded-xl border border-green-100 dark:bg-green-900/20 dark:border-green-800/40">
                                            <span className="text-2xl font-bold text-[#2F5E41] dark:text-green-200">{formData.bmi}</span>
                                            <span className="text-xs font-bold bg-white text-[#6FCF97] px-2 py-1 rounded-md shadow-sm">
                                                {getBmiStatus(parseFloat(formData.bmi))}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Kart 2: Hedef ve Aktivite (EKSİK KISIM EKLENDİ) */}
                            <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100 dark:bg-gray-900 dark:border-gray-800">
                                <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-3 dark:text-gray-100">
                                    <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-500 flex items-center justify-center"><Target size={20} /></div>
                                    Hedef ve Aktivite
                                </h2>

                                <div className="space-y-6">
                                    {/* Hedef Seçimi */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wide pl-1">Hedefiniz</label>
                                        {isEditing ? (
                                            <select name="goal" value={formData.goal} onChange={handleInputChange} className="w-full p-4 bg-gray-50 border-2 border-transparent focus:bg-white focus:border-[#6FCF97] rounded-xl outline-none font-bold text-gray-700">
                                                {goalChoices.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                                            </select>
                                        ) : (
                                            <div className="p-4 bg-purple-50 rounded-xl text-purple-700 font-bold border border-purple-100">{findGoalLabel(formData.goal)}</div>
                                        )}
                                    </div>

                                    {/* Aktivite Seçimi */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wide pl-1">Aktivite Seviyesi</label>
                                        {isEditing ? (
                                            <select name="activity_level" value={formData.activity_level} onChange={handleInputChange} className="w-full p-4 bg-gray-50 border-2 border-transparent focus:bg-white focus:border-[#6FCF97] rounded-xl outline-none font-bold text-gray-700">
                                                {activityChoices.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                                            </select>
                                        ) : (
                                            <div className="p-4 bg-blue-50 rounded-xl text-blue-700 font-bold border border-blue-100">{findActivityLabel(formData.activity_level)}</div>
                                        )}
                                    </div>
                                </div>
                            </div>

                        </div>

                        {/* SAĞ KOLON (1 Span) - HESAP BİLGİLERİ */}
                        <div className="space-y-8">
                            
                            <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100 dark:bg-gray-900 dark:border-gray-800">
                                <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-3 dark:text-gray-100">
                                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center"><User size={20} /></div>
                                    Hesap Bilgileri
                                </h2>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wide pl-1">Kullanıcı Adı</label>
                                        {isEditing ? (
                                            <input type="text" name="username" value={formData.username} onChange={handleInputChange} className="w-full p-3 bg-gray-50 rounded-xl border-2 border-transparent focus:border-[#6FCF97] outline-none" />
                                        ) : (
                                            <div className="p-3 bg-gray-50 rounded-xl text-gray-700 font-medium border border-gray-100">@{formData.username}</div>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wide pl-1">E-posta</label>
                                        {isEditing ? (
                                            <input type="email" name="email" value={formData.email} onChange={handleInputChange} className="w-full p-3 bg-gray-50 rounded-xl border-2 border-transparent focus:border-[#6FCF97] outline-none" />
                                        ) : (
                                            <div className="p-3 bg-gray-50 rounded-xl text-gray-700 font-medium border border-gray-100 flex items-center gap-2">
                                                <Mail size={16} className="text-gray-400"/> {formData.email}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <button onClick={handleLogout} className="w-full mt-8 py-3.5 bg-red-50 hover:bg-red-100 text-red-500 font-bold rounded-xl transition-colors flex items-center justify-center gap-2 border border-red-100">
                                    <LogOut size={18} /> Çıkış Yap
                                </button>
                            </div>

                             {/* Kalori Özeti */}
                            <div className="bg-[#2F5E41] rounded-[2rem] p-8 shadow-lg text-white relative overflow-hidden">
                                <div className="relative z-10">
                                    <p className="text-green-200 text-sm font-bold uppercase tracking-wider mb-2">Günlük İhtiyaç</p>
                                    <div className="text-4xl font-extrabold mb-1">{formData.daily_calorie_need}</div>
                                    <span className="text-sm font-medium opacity-80">kalori / gün</span>
                                </div>
                                <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
                            </div>

                        </div>
                    </div>
                </div>

                {/* Mobil Kaydet (Sticky Bottom) */}
                {isEditing && (
                    <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 md:hidden z-30 shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
                        <button onClick={handleSave} disabled={isLoading} className="w-full bg-[#6FCF97] hover:bg-[#5dbb85] text-white py-4 rounded-xl shadow-lg font-bold flex items-center justify-center gap-2">
                            {isLoading ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                            <span>Değişiklikleri Kaydet</span>
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
};

export default UserProfilePage;