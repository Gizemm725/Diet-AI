import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AddMealModal from '../components/AddMealModal';

// --- RESİM IMPORTLARI ---
import avatarImg from '../assets/avatar.png';
import maskotOzetImg from '../assets/maskot-ozet.png';
import maskotHedefImg from '../assets/maskot-hedef.png';

const ProfilePage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // AI Chat State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);
  
  // Chat Geçmişi
  const [chatHistory, setChatHistory] = useState([
    { type: 'bot', text: 'Merhaba! Sağlıklı yaşam hedeflerinle ilgili bana istediğini sorabilirsin. 🌸' }
  ]);

  const [userProfile, setUserProfile] = useState(null);
  const [userData, setUserData] = useState(null);
  const [weeklyData, setWeeklyData] = useState([]);
  const [todayIntake, setTodayIntake] = useState(null);
  const [todayMeals, setTodayMeals] = useState([]);
  const [showAddMeal, setShowAddMeal] = useState(false);

  // --- MACRO HESAPLAMALARI ---
  const [macroStats, setMacroStats] = useState({ carb: 0, protein: 0, fat: 0, total: 0 });

  const API_BASE_URL = 'http://localhost:8000/api/auth';

  const getAuthToken = () => localStorage.getItem('userToken');

  const getHeaders = () => {
    const token = getAuthToken();
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // YEMEKLER DEĞİŞTİĞİNDE MACROLARI HESAPLA (DÜZELTİLMİŞ VERSİYON)
  useEffect(() => {
    if (todayMeals && todayMeals.length > 0) {
        
        console.log("Hesaplama İçin Gelen Yemekler:", todayMeals); // Debug

        // Güvenli Macro Hesaplayıcı
        const calculateTotal = (type) => {
            return todayMeals.reduce((acc, meal) => {
                // 1. Serializer'dan gelen direkt değeri dene (protein, carbs, fat)
                let value = meal[type];
                
                // 2. Eğer yoksa food detaylarına bak
                if (value === undefined || value === null) {
                    value = meal.food_details?.[type] || meal.food?.[type] || 0;
                }

                // 3. Değeri miktar (quantity) ile çarp
                const amount = parseFloat(value) || 0;
                const qty = parseFloat(meal.quantity) || 1;
                
                return acc + (amount * qty);
            }, 0);
        };

        const carb = calculateTotal('carbs');
        const protein = calculateTotal('protein');
        const fat = calculateTotal('fat');
        const total = carb + protein + fat;

        setMacroStats({ carb, protein, fat, total });
    } else {
        setMacroStats({ carb: 0, protein: 0, fat: 0, total: 0 });
    }
  }, [todayMeals]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const token = getAuthToken();
      
      if (!token) {
        navigate('/');
        return;
      }

      await Promise.all([
        fetchUserData(),
        fetchUserProfile(),
        fetchWeeklyReport(),
        fetchTodayMeals()
      ]);

    } catch (err) {
      console.error('Veri çekme hatası:', err);
      setError('Veriler yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserData = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/info/`, { headers: getHeaders() });
      if (response.ok) {
        const data = await response.json();
        setUserData(data);
      }
    } catch (err) { console.error(err); }
  };

  const fetchUserProfile = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/profile/`, { headers: getHeaders() });
      if (response.ok) {
        const data = await response.json();
        setUserProfile(data);
      }
    } catch (err) { console.error(err); }
  };

  const fetchWeeklyReport = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/weekly-report/`, { headers: getHeaders() });
      if (response.ok) {
        const data = await response.json();
        setWeeklyData(data.weekly_data || []);
      }
    } catch (err) { console.error(err); }
  };

  const fetchTodayMeals = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await fetch(`${API_BASE_URL}/meals/?date=${today}`, { headers: getHeaders() });
      if (response.ok) {
        const data = await response.json();
        const meals = data.results || data;
        setTodayMeals(Array.isArray(meals) ? meals : []);
        
        // Kaloriyi Meal içinden al
        const totalCalories = (Array.isArray(meals) ? meals : []).reduce((sum, meal) => {
            const cal = parseFloat(meal.calories) || 0;
            return sum + cal;
        }, 0);
        
        setTodayIntake({ total_calories: totalCalories });
      }
    } catch (err) { console.error(err); }
  };

  const parseMessage = (text) => {
    const regex = /---DATA_START---([\s\S]*?)---DATA_END---/;
    const match = text.match(regex);
    if (match) {
      try {
        const jsonStr = match[1].trim();
        const data = JSON.parse(jsonStr);
        const cleanText = text.replace(regex, '').trim();
        return { text: cleanText, mealData: data };
      } catch (e) {
        return { text: text, mealData: null };
      }
    }
    return { text: text, mealData: null };
  };

  const handleAddSuggestedMeal = async (mealData) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      if (!mealData.food_name || !mealData.food_name.trim()) {
        setChatHistory(prev => [...prev, { type: 'bot', text: '❌ Yemek ismi eksik.' }]);
        return;
      }

      const payload = {
        food_name: String(mealData.food_name).trim(),
        calories: parseFloat(mealData.calories) || 0,
        protein: parseFloat(mealData.protein) || 0,
        carbs: parseFloat(mealData.carbs) || 0,
        fat: parseFloat(mealData.fat) || 0,
        quantity: 1,
        date: today
      };

      const response = await fetch(`${API_BASE_URL}/ai-meal-add/`, { 
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        await fetchTodayMeals();
        await fetchWeeklyReport();
        setChatHistory(prev => [...prev, { type: 'bot', text: `✅ ${mealData.food_name} eklendi!` }]);
      } else {
        setChatHistory(prev => [...prev, { type: 'bot', text: `❌ Hata oluştu.` }]);
      }
    } catch (err) {
      setChatHistory(prev => [...prev, { type: 'bot', text: '❌ Bağlantı hatası.' }]);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;

    const userMsg = chatMessage;
    setChatHistory(prev => [...prev, { type: 'user', text: userMsg }]);
    setChatMessage('');
    setIsAiTyping(true);

    try {
      const response = await fetch(`${API_BASE_URL}/ai-chat/`, { 
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ message: userMsg }),
      });

      if (response.ok) {
        const data = await response.json();
        const parsed = parseMessage(data.response || data.answer || "Cevap yok");
        setChatHistory(prev => [...prev, { type: 'bot', text: parsed.text, mealData: parsed.mealData }]); 
      } else {
        setChatHistory(prev => [...prev, { type: 'bot', text: 'Bağlantı hatası.' }]);
      }
    } catch (err) {
      setChatHistory(prev => [...prev, { type: 'bot', text: 'Bir hata oluştu.' }]);
    } finally {
      setIsAiTyping(false);
    }
  };

  const getMealTimeIcon = (mealTime) => {
    const icons = { breakfast: '☀️', lunch: '🌤️', dinner: '🌙', snack: '🍪' };
    return icons[mealTime] || '🍽️';
  };

  const getMealTimeColor = (mealTime) => {
    const colors = {
      breakfast: 'border-l-yellow-300', lunch: 'border-l-orange-300',
      dinner: 'border-l-red-300', snack: 'border-l-purple-300'
    };
    return colors[mealTime] || 'border-l-gray-300';
  };

  const getPieGradient = () => {
    if (macroStats.total === 0) {
        return `conic-gradient(#e5e7eb 0% 100%)`;
    }
    const carbPercent = (macroStats.carb / macroStats.total) * 100;
    const proteinPercent = (macroStats.protein / macroStats.total) * 100;
    
    return `conic-gradient(
        #FCA5A5 0% ${carbPercent}%, 
        #93C5FD ${carbPercent}% ${carbPercent + proteinPercent}%, 
        #D8B4FE ${carbPercent + proteinPercent}% 100%
    )`;
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-[#A8D5BA] font-bold">Yükleniyor...</div>;
  }

  return (
    <div className="min-h-screen bg-[#F7FBF9] p-4 md:p-8 relative font-sans">
      {/* Header */}
      <header className="bg-white rounded-3xl shadow-sm p-6 mb-8 flex justify-between items-center border border-gray-100">
        <div className="flex items-center gap-4">
             <img src={avatarImg} alt="Profile" className="w-16 h-16 rounded-full border-4 border-[#E8F5E9] shadow-sm object-cover hidden md:block" />
            <div>
                <h1 className="text-3xl font-bold text-gray-800 mb-2">Merhaba, {userData?.first_name || 'Kullanıcı'} 🍀</h1>
                <p className="text-gray-500 text-sm">Sağlıklı yaşam yolculuğun devam ediyor</p>
            </div>
        </div>
        <div className="flex items-center gap-4">
             <div className="w-12 h-12 rounded-full bg-[#E8F5E9] flex items-center justify-center text-2xl shadow-sm">🐧</div>
        </div>
      </header>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Section */}
        <div className="lg:col-span-2 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Haftalık Özet */}
            <div className="bg-white rounded-3xl shadow-sm p-6 relative overflow-hidden min-h-[250px] border border-gray-100">
              <h3 className="font-bold text-gray-800 mb-6 relative z-20">Haftalık Özet</h3>
              <div className="h-48 flex items-end justify-center gap-4 pb-2 relative z-10">
                {weeklyData.length > 0 ? weeklyData.map((day, index) => {
                   const maxInWeek = Math.max(...weeklyData.map(d => d.calories));
                   const scaleBase = maxInWeek > 0 ? maxInWeek : 100;
                   const h = (day.calories / scaleBase) * 100;
                   return (
                     <div key={index} className="flex flex-col items-center gap-2 group w-10 h-full justify-end">
                       <div style={{ height: `${h}%`, backgroundColor: day.calories > 0 ? '#A8D5BA' : '#e5e7eb', minHeight: '4px' }} className="w-full rounded-t-lg transition-all duration-500 relative group-hover:opacity-80">
                          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity z-30 whitespace-nowrap pointer-events-none">{Math.round(day.calories)} kcal</div>
                       </div>
                       <span className="text-[10px] md:text-xs text-gray-500 font-bold uppercase">{new Date(day.date).toLocaleDateString('tr-TR', {weekday:'short'})}</span>
                     </div>
                   )
                }) : <div className="w-full h-full flex items-center justify-center text-gray-400">Veri yok</div>}
              </div>
              <img src={maskotOzetImg} alt="Mascot" className="absolute -bottom-6 -right-4 w-36 z-0 pointer-events-none" />
            </div>

            {/* Besin Değerleri */}
            <div className="bg-white rounded-3xl shadow-sm p-6 flex flex-col justify-between border border-gray-100">
              <h3 className="font-bold text-gray-800 mb-2">Besin Değerleri</h3>
              <div className="flex items-center justify-around h-full">
                <div className="relative w-36 h-36">
                  <div className="w-full h-full rounded-full transition-all duration-1000" style={{ background: getPieGradient(), mask: 'radial-gradient(transparent 60%, black 61%)', WebkitMask: 'radial-gradient(transparent 60%, black 61%)' }}></div>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-xs text-gray-400 font-medium">Kalan</span>
                      <span className="text-xl font-bold text-gray-800">{Math.max(0, (userProfile?.daily_calorie_need || 2000) - (todayIntake?.total_calories || 0))}</span>
                      <span className="text-xs text-gray-400">Kcal</span>
                  </div>
                </div>
                <div className="flex flex-col gap-3 text-sm">
                   <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-[#FCA5A5]"></div><span className="text-gray-600">Karb: <span className="font-bold">{Math.round(macroStats.carb)}g</span></span></div>
                   <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-[#93C5FD]"></div><span className="text-gray-600">Pro: <span className="font-bold">{Math.round(macroStats.protein)}g</span></span></div>
                   <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-[#D8B4FE]"></div><span className="text-gray-600">Yağ: <span className="font-bold">{Math.round(macroStats.fat)}g</span></span></div>
                </div>
              </div>
            </div>
          </div>

          {/* Meals Section */}
          <div className="bg-white rounded-3xl shadow-sm p-6 border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Bugün Yediklerim</h2>
              <button onClick={() => setShowAddMeal(true)} className="px-6 py-3 bg-[#A8D5BA] hover:bg-[#96C9AD] text-white font-bold rounded-xl shadow-md flex items-center gap-2 transition-colors"><span>+</span> Öğün Ekle</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {todayMeals.length > 0 ? todayMeals.map((meal) => (
                  <div key={meal.id} className={`relative p-4 bg-white rounded-2xl border-l-4 ${getMealTimeColor(meal.meal_time)} shadow-sm border border-gray-100 hover:shadow-md transition-shadow`}>
                      <div className="flex justify-between items-start">
                          <div>
                              <h3 className="font-bold text-gray-800">{meal.food_name}</h3>
                              <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                                <span>🔥 {Math.round(meal.calories)} kcal</span>
                                <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                <span>{meal.quantity} porsiyon</span>
                              </p>
                          </div>
                          <span className="text-2xl bg-gray-50 p-2 rounded-lg border border-gray-100">{getMealTimeIcon(meal.meal_time)}</span>
                      </div>
                  </div>
              )) : <div className="col-span-2 py-8 text-center bg-gray-50 text-gray-400 rounded-xl border border-dashed border-gray-200">Henüz veri yok.</div>}
            </div>
          </div>
        </div>

        {/* Right Section */}
        <div className="space-y-6">
           <div className="bg-white rounded-3xl shadow-sm p-6 flex flex-col justify-between min-h-[200px] border border-gray-100">
               <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <h3 className="font-bold text-gray-800 mb-4 text-lg">Günlük Hedef</h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center p-3 bg-[#F1F8F4] rounded-xl border border-[#E8F5E9]">
                                <span className="text-gray-600 text-sm">Alınan</span>
                                <span className="font-bold text-[#6BAF8A] text-lg">{Math.round(todayIntake?.total_calories || 0)}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                                <span className="text-gray-600 text-sm">Hedef</span>
                                <span className="font-bold text-gray-600 text-lg">{userProfile?.daily_calorie_need || 2000}</span>
                            </div>
                        </div>
                    </div>
                    <img src={maskotHedefImg} alt="Hedef" className="w-28 h-28 object-contain ml-2 mt-4" />
               </div>
               <div className="mt-4">
                  <div className="w-full bg-gray-100 rounded-full h-3">
                    <div className="bg-[#A8D5BA] h-3 rounded-full transition-all duration-500" style={{ width: `${Math.min(((todayIntake?.total_calories || 0) / (userProfile?.daily_calorie_need || 2000)) * 100, 100)}%` }}></div>
                  </div>
               </div>
           </div>
        </div>
      </div>

      {/* AI CHAT */}
      <button onClick={() => setIsChatOpen(!isChatOpen)} className="fixed bottom-6 right-6 z-50 transition-transform hover:scale-110 active:scale-95">
        <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#A8D5BA] to-[#86C5A0] shadow-[0_4px_15px_rgba(168,213,186,0.5)] flex items-center justify-center border-4 border-white relative overflow-hidden"><span className="text-2xl text-white drop-shadow-md">✨</span></div>
      </button>

      {isChatOpen && (
        <div className="fixed bottom-24 right-6 z-40 w-80 md:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden animate-fade-in-up" style={{height: '500px'}}>
           <div className="bg-[#F7FBF9] p-4 border-b border-gray-100 flex justify-between items-center">
              <div className="flex items-center gap-3">
                 <img src={avatarImg} alt="AI" className="w-10 h-10 rounded-full border border-white shadow-md object-cover" />
                 <div><h4 className="font-bold text-gray-800">Paytak</h4><span className="text-xs text-[#86C5A0] font-bold">● Çevrimiçi</span></div>
              </div>
              <button onClick={() => setIsChatOpen(false)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
           </div>
           <div className="flex-1 p-4 overflow-y-auto bg-gray-50 space-y-3">
              {chatHistory.map((msg, i) => (
                <div key={i} className={`flex flex-col ${msg.type === 'user' ? 'items-end' : 'items-start'}`}>
                   <div className={`max-w-[85%] p-3 rounded-2xl text-sm shadow-sm ${msg.type === 'user' ? 'bg-[#A8D5BA] text-white rounded-br-none' : 'bg-white text-gray-700 border border-gray-100 rounded-bl-none'}`}>{msg.text}</div>
                   {msg.type === 'bot' && msg.mealData && (
                      <div className="mt-3 ml-2 animate-fade-in-up">
                          <p className="text-[10px] text-gray-400 mb-1 ml-1">Önerilen Aksiyon:</p>
                          <button onClick={() => handleAddSuggestedMeal(msg.mealData)} className="group relative flex items-center gap-3 bg-white hover:bg-[#F7FBF9] border border-[#A8D5BA] pr-4 pl-3 py-2 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
                            <div className="w-8 h-8 rounded-full bg-[#E8F5E9] flex items-center justify-center group-hover:scale-110 transition-transform"><span className="text-sm">✅</span></div>
                            <div className="flex flex-col items-start"><span className="text-xs font-bold text-gray-700 group-hover:text-[#6BAF8A] transition-colors">Evet, Ekle</span><span className="text-[10px] text-gray-500">{msg.mealData.food_name} ({msg.mealData.calories} kcal)</span></div>
                          </button>
                      </div>
                   )}
                </div>
              ))}
              {isAiTyping && <div className="text-xs text-gray-400 ml-2">Yazıyor...</div>}
           </div>
           <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-gray-100">
              <div className="flex gap-2">
                 <input type="text" value={chatMessage} onChange={(e) => setChatMessage(e.target.value)} placeholder="Bir şeyler sor..." className="flex-1 bg-gray-100 text-gray-800 text-sm rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#A8D5BA] transition-all"/>
                 <button type="submit" disabled={isAiTyping} className={`w-10 h-10 rounded-full text-white flex items-center justify-center hover:shadow-lg transform active:scale-95 transition-all ${isAiTyping ? 'bg-gray-300' : 'bg-[#A8D5BA] hover:bg-[#96C9AD]'}`}>➤</button>
              </div>
           </form>
        </div>
      )}

      {showAddMeal && <AddMealModal isOpen={showAddMeal} onClose={() => setShowAddMeal(false)} onMealAdded={() => { setShowAddMeal(false); fetchTodayMeals(); fetchWeeklyReport(); }} />} 
    </div>
  );
};

export default ProfilePage;