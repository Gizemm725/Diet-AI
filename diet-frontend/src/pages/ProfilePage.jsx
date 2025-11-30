import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom'; 
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '../components/Sidebar'; 
import AddMealModal from '../components/AddMealModal';

// --- RESİM IMPORTLARI ---
import avatarImg from '../assets/avatar.png';
import maskotOzetImg from '../assets/maskot-ozet.png'; // Kullanılmıyor ama importta kalsın
import maskotHedefImg from '../assets/maskot-hedef.png';

const ProfilePage = () => { 
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Chat States
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [chatHistory, setChatHistory] = useState([
    { type: 'bot', text: 'Merhaba! Sağlıklı yaşam hedeflerinle ilgili bana istediğini sorabilirsin. 🌸' }
  ]);

  // Data States
  const [userProfile, setUserProfile] = useState(null);
  const [userData, setUserData] = useState(null);
  const [weeklyData, setWeeklyData] = useState([]);
  const [todayIntake, setTodayIntake] = useState(null);
  const [todayMeals, setTodayMeals] = useState([]);
  const [showAddMeal, setShowAddMeal] = useState(false);
  const [macroStats, setMacroStats] = useState({ carb: 0, protein: 0, fat: 0, total: 0 });
  
  // Accordion State - default collapsed
  const [openSections, setOpenSections] = useState({
      breakfast: false, lunch: false, dinner: false, snack: false
  });

  const API_BASE_URL = 'http://localhost:8000/api/auth';

  // --- HELPER FUNCTIONS ---
  const getAuthToken = () => localStorage.getItem('userToken');

  const getHeaders = () => {
    const token = getAuthToken();
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  };

  useEffect(() => { fetchAllData(); }, []);

  // Bugünün Makro Hesaplaması
  useEffect(() => {
    if (todayMeals && todayMeals.length > 0) {
        const calculateTotal = (type) => {
            return todayMeals.reduce((acc, meal) => {
                let value = meal[type] || meal.food?.[type] || meal.food_details?.[type] || 0;
                const amount = parseFloat(value) || 0;
                const qty = parseFloat(meal.quantity) || 1;
                return acc + (amount * qty);
            }, 0);
        };
        setMacroStats({
             carb: calculateTotal('carbs'),
             protein: calculateTotal('protein'),
             fat: calculateTotal('fat'),
             total: calculateTotal('carbs') + calculateTotal('protein') + calculateTotal('fat')
        });
    } else {
        setMacroStats({ carb: 0, protein: 0, fat: 0, total: 0 });
    }
  }, [todayMeals]);

  // API Çağrıları
  const fetchAllData = async () => {
    try {
      setLoading(true);
      const token = getAuthToken();
      if (!token) { navigate('/'); return; }
      await Promise.all([fetchUserData(), fetchUserProfile(), fetchWeeklyReport(), fetchTodayMeals()]);
    } catch (err) { console.error(err); setError('Hata oluştu.'); } finally { setLoading(false); }
  };

  const fetchUserData = async () => {
    try { const res = await fetch(`${API_BASE_URL}/info/`, { headers: getHeaders() }); if(res.ok) setUserData(await res.json()); } catch(e){}
  };
  const fetchUserProfile = async () => {
    try { const res = await fetch(`${API_BASE_URL}/profile/`, { headers: getHeaders() }); if(res.ok) setUserProfile(await res.json()); } catch(e){}
  };
  
  // Haftalık Rapor
  const fetchWeeklyReport = async () => {
    try { 
        const res = await fetch(`${API_BASE_URL}/weekly-report/`, { headers: getHeaders() }); 
        if(res.ok) {
            const data = await res.json();
            let wData = data.weekly_data || [];
            if (wData.length === 0) {
                const today = new Date();
                for (let i = 6; i >= 0; i--) {
                    const d = new Date(today);
                    d.setDate(d.getDate() - i);
                    wData.push({ date: d.toISOString().split('T')[0], calories: 0 });
                }
            }
            setWeeklyData(wData); 
        }
    } catch(e){}
  };

  const fetchTodayMeals = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const res = await fetch(`${API_BASE_URL}/meals/?date=${today}`, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        const meals = data.results || data;
        setTodayMeals(Array.isArray(meals) ? meals : []);
        const total = (Array.isArray(meals) ? meals : []).reduce((s, m) => s + (parseFloat(m.calories)||0), 0);
        setTodayIntake({ total_calories: total });
      }
    } catch(e){}
  };

  // --- CHAT FUNCTIONS ---
  const parseMessage = (text) => {
    const regex = /---DATA_START---([\s\S]*?)---DATA_END---/;
    const match = text.match(regex);
    if (match) {
      try { return { text: text.replace(regex, '').trim(), mealData: JSON.parse(match[1].trim()) }; } catch (e) { return { text: text, mealData: null }; }
    }
    return { text: text, mealData: null };
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;
    const userMsg = chatMessage;
    setChatHistory(prev => [...prev, { type: 'user', text: userMsg }]);
    setChatMessage('');
    setIsAiTyping(true);
    try {
      const res = await fetch(`${API_BASE_URL}/ai-chat/`, { 
        method: 'POST', headers: getHeaders(), body: JSON.stringify({ message: userMsg }),
      });
      if (res.ok) {
        const data = await res.json();
        const parsed = parseMessage(data.response || data.answer || "Cevap yok");
        setChatHistory(prev => [...prev, { type: 'bot', text: parsed.text, mealData: parsed.mealData }]); 
      }
    } catch (err) { setChatHistory(prev => [...prev, { type: 'bot', text: 'Hata oluştu.' }]); } finally { setIsAiTyping(false); }
  };

  // Saat bazlı öğün seçimi
  const getMealTimeByHour = () => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 11) return 'breakfast';
    if (hour >= 11 && hour < 15) return 'lunch';
    if (hour >= 15 && hour < 20) return 'dinner';
    return 'snack';
  };

  const handleAddSuggestedMeal = async (mealData) => {
     try {
       // AI'dan gelen meal_time varsa onu kullan, yoksa saat bazlı belirle
       const mealTime = mealData.meal_time || getMealTimeByHour();
       const payload = { 
         ...mealData, 
         quantity: mealData.quantity || 1, 
         date: new Date().toISOString().split('T')[0], 
         meal_time: mealTime 
       };
       const res = await fetch(`${API_BASE_URL}/ai-meal-add/`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(payload) });
       if(res.ok) { 
         await fetchTodayMeals(); 
         await fetchWeeklyReport(); 
         setChatHistory(prev => [...prev, { type: 'bot', text: '✅ Eklendi!' }]); 
       }
     } catch(e) {
       console.error('AI meal ekleme hatası:', e);
     }
  };

  // --- CHART HELPERS ---
  const getPieChartData = () => {
    const { carb, protein, fat, total } = macroStats;
    if (!total || total < 0.01) return { gradient: 'conic-gradient(#f3f4f6 0% 100%)', hasData: false, total: 0 };
    const cP = (carb/total)*100, pP = (protein/total)*100, fP = (fat/total)*100;
    const gradient = `conic-gradient(#FB923C 0deg ${(cP/100)*360}deg, #60A5FA ${(cP/100)*360}deg ${(cP/100 + pP/100)*360}deg, #C084FC ${(cP/100 + pP/100)*360}deg 360deg)`;
    return { carbPercent: cP, proteinPercent: pP, fatPercent: fP, total: Math.round(total), gradient, hasData: true };
  };

  const groupedMeals = todayMeals.reduce((groups, meal) => {
      const time = meal.meal_time || 'snack';
      if (!groups[time]) groups[time] = [];
      groups[time].push(meal);
      return groups;
  }, {});

  const orderedMealTimes = ['breakfast', 'lunch', 'dinner', 'snack'];
  const mealTimeTr = { breakfast: 'Kahvaltı', lunch: 'Öğle Yemeği', dinner: 'Akşam Yemeği', snack: 'Atıştırmalık' };
  const getMealTimeIcon = (t) => ({ breakfast: '☀️', lunch: '🌤️', dinner: '🌙', snack: '🍪' }[t] || '🍽️');

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#F7FBF9]"><div className="w-12 h-12 border-4 border-[#6FCF97] border-t-transparent rounded-full animate-spin"></div></div>;

  const pieData = getPieChartData();

  return (
    // ANA ARKA PLAN RENGİ GÜNCELLENDİ: Kırık Yeşil Gradyan
    <div className="flex min-h-screen bg-gradient-to-br from-[#EBF7EE] to-[#F7FBF9] font-sans dark:from-gray-900 dark:to-gray-950">
      
      {/* 1. SOL SIDEBAR */}
      <Sidebar />

      {/* 2. ANA İÇERİK ALANI */}
      <main className="flex-1 lg:ml-64 p-6 md:p-8 transition-all duration-300">
        
        {/* Üst Arama/Profil Header */}
        <header className="flex justify-between items-center mb-6">
           
            <div className="flex items-center gap-4 ml-auto">
                <button className="w-10 h-10 bg-white rounded-full border border-gray-100 flex items-center justify-center shadow-sm relative hover:bg-gray-50 transition-colors dark:bg-gray-900 dark:border-gray-800 dark:hover:bg-gray-800">
                    🔔 <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-orange-500 rounded-full border-2 border-white"></span>
                </button>
                <Link to="/profile" className="flex items-center gap-3 bg-white pl-2 pr-4 py-1.5 rounded-full border border-gray-100 shadow-sm hover:shadow-md transition-all dark:bg-gray-900 dark:border-gray-800">
                    <img src={avatarImg} alt="User" className="w-8 h-8 rounded-full object-cover border-2 border-green-100" />
                    <span className="text-sm font-bold text-gray-700 dark:text-gray-200">{userData?.first_name || 'Gizem'}</span>
                </Link>
            </div>
        </header>

        {/* 3. DASHBOARD GRID YAPISI */}
        <div className="space-y-6">
            
            {/* A) KARŞILAMA BANNERI - COMPACT & WARM LIGHT THEME */}
            <div className="relative w-full rounded-[2rem] overflow-hidden border border-orange-50 bg-gradient-to-r from-[#FFF8F0] via-white to-white shadow-sm dark:border-gray-800 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
                
                {/* Dekoratif Çok Hafif Turuncu Geçişler (Background Glows) */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-orange-100/40 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                <div className="absolute bottom-0 left-10 w-48 h-48 bg-yellow-50/50 rounded-full blur-3xl pointer-events-none"></div>
                
                {/* İçerik Alanı - Padding azaltıldı (Daha minimal) */}
                <div className="relative z-10 p-6 flex flex-col md:flex-row justify-between items-center gap-4">
                    
                    {/* Sol Taraf: Metinler */}
                    <div className="text-center md:text-left space-y-2 max-w-lg">
                        
                        {/* Küçük Etiket */}
                        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-orange-50 border border-orange-100 mb-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></span>
                            <span className="text-[10px] font-bold text-orange-600 tracking-wide uppercase">Günlük Özet</span>
                        </div>
                        
                        {/* Başlık - "Gizem" Rengi YEŞİL Yapıldı */}
                        <h1 className="text-2xl md:text-3xl font-extrabold text-gray-800 leading-tight dark:text-white">
                            Harika gidiyorsun, <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2F5E41] to-[#6FCF97]">{userData?.first_name || 'Gizem'}!</span> 👋
                        </h1>
                        
                        <p className="text-gray-500 text-xs md:text-sm font-medium leading-relaxed max-w-sm dark:text-gray-300">
                            Bugünkü hedeflerine ulaşmak üzeresin. Enerjini yüksek tut!
                        </p>
                        
                        {/* Butonlar - "Öğün Ekle" VE "Fotoğraf Tara" */}
                        <div className="pt-2 flex gap-3 justify-center md:justify-start">
                            <button 
                                onClick={() => setShowAddMeal(true)} 
                                className="bg-[#6FCF97] hover:bg-[#5dbb85] text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-green-200 transition-all transform hover:scale-[1.02] active:scale-95 flex items-center gap-2 text-sm"
                            >
                                <span>+</span> Öğün Ekle
                            </button>
                            
                            {/* --- YENİ EKLENEN OCR BUTONU --- */}
                            <button 
                                onClick={() => navigate('/scan')} 
                                className="bg-white text-[#6FCF97] border-2 border-[#6FCF97] hover:bg-green-50 px-5 py-2.5 rounded-xl font-bold shadow-sm transition-all transform hover:scale-[1.02] active:scale-95 flex items-center gap-2 text-sm"
                            >
                                <span>📸</span> Fotoğraf Tara
                            </button>
                        </div>
                    </div>
                    
                    {/* Sağ Taraf: Maskot */}
                    <div className="relative flex-shrink-0 -my-4 md:-mr-4">
                        <img 
                            src={maskotHedefImg} 
                            alt="Mascot" 
                            className="h-40 object-contain drop-shadow-lg transform hover:scale-105 transition-transform duration-500" 
                        />
                    </div>
                </div>
            </div>

            {/* B) İSTATİSTİK KARTLARI */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Kart 1: Besin Değerleri */}
                <div className="bg-white p-5 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col items-center justify-between h-full hover:shadow-md transition-shadow dark:bg-gray-900 dark:border-gray-800">
                    <div className="w-full flex justify-between items-center mb-4">
                        <h3 className="font-bold text-gray-800 text-base">Besin Değerleri</h3>
                        <span className="text-[10px] bg-orange-50 text-orange-600 font-bold px-2.5 py-1 rounded-full">Günlük</span>
                    </div>
                    
                    <div className="relative w-32 h-32 flex items-center justify-center">
                         <div className="w-full h-full rounded-full transition-all duration-1000" style={{ background: pieData.gradient, mask: 'radial-gradient(transparent 60%, black 61%)', WebkitMask: 'radial-gradient(transparent 60%, black 61%)' }}></div>
                         <div className="absolute flex flex-col items-center">
                            <span className="text-2xl font-extrabold text-gray-800">{pieData.total}</span>
                            <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">Kalori</span>
                         </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 w-full mt-4">
                        <div className="text-center p-1.5 rounded-xl bg-orange-50 border border-orange-100">
                            <div className="w-1.5 h-1.5 rounded-full bg-orange-400 mx-auto mb-1"></div>
                            <span className="block text-xs font-bold text-gray-700">{Math.round(macroStats.carb)}g</span>
                            <span className="text-[9px] text-gray-400 font-bold">KARB</span>
                        </div>
                        <div className="text-center p-1.5 rounded-xl bg-blue-50 border border-blue-100">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mx-auto mb-1"></div>
                            <span className="block text-xs font-bold text-gray-700">{Math.round(macroStats.protein)}g</span>
                            <span className="text-[9px] text-gray-400 font-bold">PROT</span>
                        </div>
                        <div className="text-center p-1.5 rounded-xl bg-purple-50 border border-purple-100">
                            <div className="w-1.5 h-1.5 rounded-full bg-purple-400 mx-auto mb-1"></div>
                            <span className="block text-xs font-bold text-gray-700">{Math.round(macroStats.fat)}g</span>
                            <span className="text-[9px] text-gray-400 font-bold">YAĞ</span>
                        </div>
                    </div>
                </div>

                {/* Kart 2: Haftalık Kalori */}
                <div className="bg-white p-5 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col h-full hover:shadow-md transition-shadow dark:bg-gray-900 dark:border-gray-800">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-gray-800 text-base">Haftalık Kalori</h3>
                        <div className="flex gap-1 items-center">
                             <span className="w-1.5 h-1.5 rounded-full bg-orange-400"></span>
                             <span className="text-[10px] text-gray-400">kcal</span>
                        </div>
                    </div>
                    
                    <div className="flex-1 flex items-end justify-between gap-2 min-h-[120px]">
                        {weeklyData.map((day, i) => {
                            const max = Math.max(...weeklyData.map(d=>d.calories), 2000);
                            const h = day.calories > 0 ? (day.calories / max) * 100 : 5;
                            
                            return (
                                <div key={i} className="flex flex-col items-center gap-2 flex-1 group h-full justify-end">
                                    <div className="w-full bg-gray-50 rounded-t-lg relative overflow-hidden h-full flex items-end">
                                        <div 
                                            style={{height: `${h}%`}} 
                                            className={`w-full rounded-t-lg transition-all duration-700 relative ${day.calories > 0 ? 'bg-orange-400 group-hover:bg-orange-500' : 'bg-gray-200'}`}
                                        >
                                            {day.calories > 0 && (
                                                <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[9px] py-0.5 px-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {Math.round(day.calories)}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                                        {new Date(day.date).toLocaleDateString('tr-TR', {weekday:'short'}).slice(0,3)}
                                    </span>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Kart 3: Hedef & Kalori */}
                <div className="bg-[#2D3142] p-5 rounded-[2rem] shadow-lg text-white flex flex-col justify-between relative overflow-hidden h-full hover:shadow-2xl transition-shadow">
                     <div className="relative z-10 flex flex-col h-full justify-between">
                        <div>
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1">Kalan Kalori</p>
                                    <h3 className="text-3xl font-bold tracking-tight">{Math.max(0, (userProfile?.daily_calorie_need || 2000) - (todayIntake?.total_calories || 0))}</h3>
                                    <span className="text-xs text-gray-400">kcal</span>
                                </div>
                                <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400 text-sm">
                                    🔥
                                </div>
                            </div>
                            
                            <div className="mt-4 mb-2 flex justify-between text-[10px] text-gray-300 font-medium">
                                <span>Alınan: <span className="text-white">{Math.round(todayIntake?.total_calories || 0)}</span></span>
                                <span>Hedef: <span className="text-white">{userProfile?.daily_calorie_need || 2000}</span></span>
                            </div>
                            
                            <div className="w-full bg-gray-700/50 rounded-full h-2.5 mb-4 backdrop-blur-sm border border-white/5">
                                <div 
                                    className="bg-gradient-to-r from-orange-400 to-red-400 h-2.5 rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(251,146,60,0.5)]" 
                                    style={{ width: `${Math.min(((todayIntake?.total_calories || 0) / (userProfile?.daily_calorie_need || 2000)) * 100, 100)}%` }}
                                ></div>
                            </div>
                        </div>

                        <div className="flex gap-2 mt-auto">
                            <div className="bg-white/5 border border-white/10 p-2.5 rounded-xl flex-1 flex items-center gap-2 hover:bg-white/10 transition-colors">
                                <span className="text-lg">💧</span>
                                <div>
                                    <span className="block text-[10px] text-gray-400">Su</span>
                                    <span className="font-bold text-xs">1.2L</span>
                                </div>
                            </div>
                             <div className="bg-white/5 border border-white/10 p-2.5 rounded-xl flex-1 flex items-center gap-2 hover:bg-white/10 transition-colors">
                                <span className="text-lg">⚡</span>
                                <div>
                                    <span className="block text-[10px] text-gray-400">Egzersiz</span>
                                    <span className="font-bold text-xs">340</span>
                                </div>
                            </div>
                        </div>
                     </div>
                     
                     <div className="absolute -right-10 -top-10 w-40 h-40 bg-orange-500/20 rounded-full blur-3xl"></div>
                     <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl"></div>
                </div>
            </div>

            {/* C) YEMEK LİSTESİ */}
            <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-6 md:p-8 dark:bg-gray-900 dark:border-gray-800">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                        <span className="w-1.5 h-6 bg-green-500 rounded-full"></span>
                        <h3 className="text-lg font-bold text-gray-800">Bugün Ne Yedim?</h3>
                    </div>
                    <Link to="/meals" className="text-xs font-bold text-orange-500 hover:text-orange-600 hover:underline transition-colors">Tümünü Gör →</Link>
                </div>
                
                {todayMeals.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center bg-gray-50/50 rounded-3xl border border-dashed border-gray-200">
                        <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center text-2xl shadow-sm mb-3">🍎</div>
                        <p className="text-gray-500 font-medium text-sm mb-1">Henüz bir öğün eklemedin.</p>
                        <p className="text-gray-400 text-xs">Güne başlamak için yukarıdaki "Öğün Ekle" butonunu kullan.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {orderedMealTimes.map((mealTime) => {
                            const mealsInThisGroup = groupedMeals[mealTime];
                            if (!mealsInThisGroup) return null;
                            const isOpen = openSections[mealTime];
                            
                            return (
                                <div key={mealTime} className="border border-gray-100 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-md bg-white group">
                                    <button 
                                        onClick={() => setOpenSections(p => ({...p, [mealTime]: !p[mealTime]}))}
                                        className="w-full p-4 flex items-center justify-between bg-white hover:bg-gray-50 transition-colors"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl border-2 shadow-sm
                                                ${mealTime === 'breakfast' ? 'bg-orange-50 border-orange-100 text-orange-500' : 
                                                  mealTime === 'lunch' ? 'bg-green-50 border-green-100 text-green-500' : 
                                                  mealTime === 'dinner' ? 'bg-blue-50 border-blue-100 text-blue-500' : 'bg-purple-50 border-purple-100 text-purple-500'}`}>
                                                {getMealTimeIcon(mealTime)}
                                            </div>
                                            <div className="text-left">
                                                <h4 className="font-bold text-gray-800 text-base">{mealTimeTr[mealTime]}</h4>
                                                <span className="text-xs text-gray-500 font-medium">{mealsInThisGroup.length} ürün</span>
                                            </div>
                                        </div>
                                        <div className={`w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 text-xs transform transition-transform duration-300 ${isOpen ? 'rotate-180 bg-orange-100 text-orange-500' : ''}`}>▼</div>
                                    </button>
                                    
                                    <AnimatePresence>
                                        {isOpen && (
                                            <motion.div 
                                                initial={{height:0, opacity:0}} animate={{height:'auto', opacity:1}} exit={{height:0, opacity:0}}
                                                className="bg-gray-50/50 border-t border-gray-100 dark:bg-gray-800/50 dark:border-gray-800"
                                            >
                                                {mealsInThisGroup.map(meal => (
                                                    <div key={meal.id} className="p-3.5 flex justify-between items-center hover:bg-white transition-colors border-b border-gray-100 last:border-0">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-gray-300"></div>
                                                            <div>
                                                                <p className="font-bold text-gray-700 text-sm">{meal.food_name}</p>
                                                                <div className="flex gap-2 text-[9px] font-bold mt-0.5">
                                                                    <span className="text-orange-400">K: {Math.round(meal.carbs)}</span>
                                                                    <span className="text-blue-400">P: {Math.round(meal.protein)}</span>
                                                                    <span className="text-purple-400">Y: {Math.round(meal.fat)}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-[10px] font-bold text-gray-400 bg-white border border-gray-200 px-1.5 py-0.5 rounded-md">{meal.quantity}x</span>
                                                            <span className="font-bold text-gray-800 text-sm w-14 text-right">{Math.round(meal.calories)} kcal</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

        </div>

        {/* 4. CHAT VE MODAL */}
        <button onClick={() => setIsChatOpen(!isChatOpen)} className="fixed bottom-8 right-8 z-50 transition-transform hover:scale-110 active:scale-95 group">
            <div className="w-14 h-14 rounded-full bg-[#6FCF97] hover:bg-[#5dbb85] text-white flex items-center justify-center shadow-lg shadow-green-400/50 border-2 border-white transition-all relative">
                <span className="text-xl">✨</span>
                <div className="absolute inset-0 rounded-full pointer-events-none shadow-[0_0_18px_rgba(111,207,151,0.8)]"></div>
            </div>
            <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap font-bold">AI Diyetisyen</span>
        </button>

        {isChatOpen && (
            <div className="fixed bottom-28 right-8 z-40 w-80 md:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden animate-fade-in-up" style={{height: '500px'}}>
               <div className="bg-[#6FCF97] p-4 text-white flex justify-between items-center">
                   <div className="flex items-center gap-3">
                       <div className="relative">
                            <img src={avatarImg} className="w-9 h-9 rounded-full border-2 border-white/50 bg-white object-cover"/>
                            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-white border-2 border-[#6FCF97] rounded-full"></span>
                       </div>
                       <div><h4 className="font-bold text-sm">Paytak AI</h4><span className="text-[10px] text-green-50 font-medium">Size nasıl yardım edebilirim?</span></div>
                   </div>
                   <button onClick={()=>setIsChatOpen(false)} className="opacity-80 hover:opacity-100 text-lg">×</button>
               </div>
               <div className="flex-1 p-4 overflow-y-auto bg-[#F7FBF9] space-y-3">
                   {chatHistory.map((msg, i) => (
                       <div key={i} className={`flex flex-col ${msg.type === 'user' ? 'items-end' : 'items-start'}`}>
                           <div className={`max-w-[85%] p-3 rounded-2xl text-sm shadow-sm ${msg.type === 'user' ? 'bg-[#6FCF97] text-white rounded-br-none' : 'bg-white border border-gray-100 text-gray-700 rounded-bl-none'}`}>{msg.text}</div>
                           {msg.type === 'bot' && msg.mealData && (
                                <div className="mt-2 ml-1">
                                    {(Array.isArray(msg.mealData) ? msg.mealData : [msg.mealData]).map((item, idx) => (
                                        <button key={idx} onClick={()=>handleAddSuggestedMeal(item)} className="text-xs bg-white border border-green-200 text-green-700 px-3 py-2 rounded-xl shadow-sm hover:bg-green-50 block mt-1 transition-colors">
                                            + Ekle: {item.food_name} ({item.calories} kcal)
                                        </button>
                                    ))}
                                </div>
                           )}
                       </div>
                   ))}
                   {isAiTyping && <div className="text-xs text-gray-400 ml-2">Yazıyor...</div>}
               </div>
               <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-gray-100 flex gap-2">
                   <input value={chatMessage} onChange={e=>setChatMessage(e.target.value)} placeholder="Bir şeyler yaz..." className="flex-1 bg-gray-100 rounded-full px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-green-400 transition-all"/>
                   <button type="submit" className="w-10 h-10 bg-[#6FCF97] hover:bg-[#5dbb85] rounded-full text-white flex items-center justify-center transition-colors shadow-sm">➤</button>
               </form>
            </div>
        )}

        <AddMealModal isOpen={showAddMeal} onClose={() => setShowAddMeal(false)} onMealAdded={() => { setShowAddMeal(false); fetchTodayMeals(); fetchWeeklyReport(); }} />
      </main>

      <style>{`
        .animate-fade-in-up { animation: fadeInUp 0.3s ease-out; }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
};

export default ProfilePage;