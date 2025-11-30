import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { Calendar, ChevronLeft, ChevronRight, Plus, ChefHat } from 'lucide-react';
import AddMealModal from '../components/AddMealModal';

// API URL
const API_BASE_URL = 'http://localhost:8000/api/auth';

const MealsPage = () => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // DÜZELTME 1: Sadece true/false değil, hangi öğün olduğunu tutuyoruz (örn: 'breakfast')
  const [activeMealType, setActiveMealType] = useState(null); 

  // --- Yardımcı Fonksiyonlar ---
  const getAuthToken = () => localStorage.getItem('userToken');
  const getHeaders = () => ({
    'Authorization': `Bearer ${getAuthToken()}`,
    'Content-Type': 'application/json',
  });

  const formatDateForApi = (date) => date.toISOString().split('T')[0];

  const formatDateDisplay = (date) => {
    return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' });
  };

  const changeDate = (days) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate);
  };

  // --- Veri Çekme ---
  const fetchMeals = async () => {
    setLoading(true);
    const token = getAuthToken();
    if (!token) { navigate('/'); return; }

    try {
      const dateStr = formatDateForApi(selectedDate);
      const response = await fetch(`${API_BASE_URL}/meals/?date=${dateStr}`, { headers: getHeaders() });
      if (response.ok) {
        const data = await response.json();
        setMeals(Array.isArray(data.results) ? data.results : (Array.isArray(data) ? data : []));
      }
    } catch (error) {
      console.error("Hata:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeals();
  }, [selectedDate]);

  // Yemekleri Kategorilere Ayır
  const groupedMeals = {
    breakfast: meals.filter(m => m.meal_time === 'breakfast'),
    lunch: meals.filter(m => m.meal_time === 'lunch'),
    dinner: meals.filter(m => m.meal_time === 'dinner'),
    snack: meals.filter(m => m.meal_time === 'snack' || !['breakfast', 'lunch', 'dinner'].includes(m.meal_time)),
  };

  // --- KATEGORİ AYARLARI ---
  const categories = [
    { 
        key: 'breakfast', 
        label: 'Kahvaltı', 
        color: 'text-green-800',
        badgeColor: 'bg-green-100 text-green-700',
        // Kahvaltı için daha görünür bir resim
        image: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80', 
        borderColor: 'border-green-100'
    },
    { 
        key: 'lunch', 
        label: 'Öğle Yemeği', 
        color: 'text-orange-800',
        badgeColor: 'bg-orange-100 text-orange-700',
        image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80', 
        borderColor: 'border-orange-100'
    },
    { 
        key: 'snack', 
        label: 'Atıştırmalık', 
        color: 'text-purple-800',
        badgeColor: 'bg-purple-100 text-purple-700',
        image: 'https://images.unsplash.com/photo-1499125562588-29fb8a56b5d5?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80', 
        borderColor: 'border-purple-100'
    },
    { 
        key: 'dinner', 
        label: 'Akşam Yemeği', 
        color: 'text-blue-800',
        badgeColor: 'bg-blue-100 text-blue-700',
        image: 'https://images.unsplash.com/photo-1594041680534-e8c8cdebd659?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80', 
        borderColor: 'border-blue-100'
    },
  ];

  return (
    <div className="flex min-h-screen bg-[#F8F9FA] font-sans dark:bg-gray-950">
      <Sidebar />

      <main className="flex-1 lg:ml-64 p-6 md:p-10 transition-all duration-300">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2 dark:text-gray-100">
                Yemek Günlüğü <span className="text-2xl">📖</span>
            </h1>
            <p className="text-gray-500 text-sm mt-1 dark:text-gray-300">Bugün ne yediğini detaylıca incele.</p>
          </div>

          <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100 dark:bg-gray-900 dark:border-gray-800">
            <button onClick={() => changeDate(-1)} className="p-2 hover:bg-gray-50 rounded-xl text-gray-500 hover:text-gray-800 transition-colors dark:hover:bg-gray-800 dark:text-gray-300 dark:hover:text-gray-100"><ChevronLeft size={20} /></button>
            <div className="flex items-center gap-2 px-4 py-1 bg-gray-50 rounded-xl border border-gray-100 dark:bg-gray-800 dark:border-gray-700">
              <Calendar size={16} className="text-gray-400" />
              <span className="font-bold text-gray-700 text-sm min-w-[120px] text-center dark:text-gray-200">{formatDateDisplay(selectedDate)}</span>
            </div>
            <button onClick={() => changeDate(1)} className="p-2 hover:bg-gray-50 rounded-xl text-gray-500 hover:text-gray-800 transition-colors dark:hover:bg-gray-800 dark:text-gray-300 dark:hover:text-gray-100"><ChevronRight size={20} /></button>
          </div>

          {/* Genel Ekle Butonu (Varsayılan olarak snack veya boş açar) */}
          <button 
            onClick={() => setActiveMealType('snack')}
            className="bg-[#6FCF97] hover:bg-[#5dbb85] text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-green-200 transition-all flex items-center gap-2 active:scale-95"
          >
            <Plus size={20} /> Öğün Ekle
          </button>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="flex justify-center py-20"><div className="animate-spin w-10 h-10 border-4 border-[#6FCF97] border-t-transparent rounded-full"></div></div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {categories.map((cat) => {
              const categoryMeals = groupedMeals[cat.key] || [];
              const totalCalories = categoryMeals.reduce((sum, m) => sum + (parseFloat(m.calories) || 0), 0);

              return (
                // DÜZELTME 2: h-[500px] ile sabit yükseklik verdik. Hepsi eşit olacak.
                <div key={cat.key} className={`relative bg-white rounded-[2rem] shadow-sm border ${cat.borderColor} overflow-hidden flex flex-col h-[500px] group hover:shadow-md transition-shadow duration-300 dark:bg-gray-900 dark:border-gray-800`}>
                  
                  {/* Arka Plan Resmi */}
                  <div className="absolute inset-0 z-0">
                      <img 
                        src={cat.image} 
                        alt={cat.label} 
                        className="w-full h-full object-cover opacity-[0.25] transition-transform duration-700 group-hover:scale-105" 
                        onError={(e) => {
                          // Resim yüklenemezse varsayılan bir resim kullan
                          e.target.src = 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80';
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-b from-white/70 via-white/40 to-white/10 dark:from-gray-900/70 dark:via-gray-900/40 dark:to-gray-900/10"></div>
                  </div>

                  <div className="relative z-10 flex flex-col h-full">
                      
                      {/* Kart Header */}
                      <div className="p-6 flex justify-between items-center border-b border-gray-100/50 backdrop-blur-[2px] flex-shrink-0 dark:border-gray-800/60">
                        <div className="flex items-center gap-3">
                          <h3 className={`font-bold text-xl ${cat.color} dark:text-gray-100`}>{cat.label}</h3>
                          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${cat.badgeColor}`}>
                            {categoryMeals.length} ürün
                          </span>
                        </div>
                        <div className="bg-white/80 backdrop-blur-md px-4 py-1.5 rounded-xl shadow-sm border border-gray-100 text-gray-700 font-bold text-sm dark:bg-gray-800/80 dark:border-gray-700 dark:text-gray-100">
                          {Math.round(totalCalories)} kcal
                        </div>
                      </div>

                      {/* Liste Alanı - Scrollable (overflow-y-auto) */}
                      <div className="p-6 flex-1 space-y-3 overflow-y-auto custom-scrollbar">
                        {categoryMeals.length === 0 ? (
                          <div className="h-full flex flex-col items-center justify-center text-gray-400 py-4 opacity-70">
                            <div className="w-16 h-16 rounded-full bg-white/60 flex items-center justify-center mb-2 shadow-sm dark:bg-gray-800/60">
                                <ChefHat size={32} className="opacity-30" />
                            </div>
                            <p className="text-xs font-medium dark:text-gray-300">Bu öğün henüz boş.</p>
                            {/* DÜZELTME 1: Bu butona basınca o kartın tipi (cat.key) sete ediliyor */}
                            <button onClick={() => setActiveMealType(cat.key)} className="text-[#6FCF97] text-xs font-bold hover:underline mt-1 cursor-pointer">+ Ekle</button>
                          </div>
                        ) : (
                          <>
                            {categoryMeals.map((meal) => (
                              <div key={meal.id} className="flex items-center justify-between p-3.5 rounded-2xl bg-white/80 backdrop-blur-sm border border-white/50 shadow-sm hover:border-[#6FCF97]/30 hover:shadow-md hover:bg-white transition-all duration-300 dark:bg-gray-800/60 dark:border-gray-700 dark:hover:bg-gray-800">
                                <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex flex-col items-center justify-center text-xs font-bold text-gray-600 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100">
                                      {meal.quantity}x
                                  </div>
                                  <div>
                                    <h4 className="font-bold text-gray-800 text-sm line-clamp-1 dark:text-gray-100">{meal.food_name}</h4>
                                    <div className="flex gap-2 text-[10px] font-bold mt-0.5 text-gray-400 dark:text-gray-300">
                                      <span className="text-orange-400">K: {Math.round(meal.carbs)}</span>
                                      <span className="text-blue-400">P: {Math.round(meal.protein)}</span>
                                      <span className="text-purple-400">Y: {Math.round(meal.fat)}</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="font-bold text-[#6FCF97] text-sm bg-green-50 px-2 py-1 rounded-lg dark:bg-green-900/20">
                                  {Math.round(meal.calories)}
                                </div>
                              </div>
                            ))}
                            {/* Dolu olduğunda altta görünen ekle butonu */}
                            <button 
                                onClick={() => setActiveMealType(cat.key)} 
                                className="w-full py-3 mt-2 border-2 border-dashed border-gray-300 text-gray-400 rounded-xl text-xs font-bold hover:border-[#6FCF97] hover:text-[#6FCF97] transition-colors dark:border-gray-700 dark:text-gray-300"
                            >
                                + Ürün Ekle
                            </button>
                          </>
                        )}
                      </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal - defaultMealTime prop'u eklendi */}
        <AddMealModal 
            isOpen={!!activeMealType} 
            onClose={() => {
                setActiveMealType(null);
                fetchMeals(); // Kapatınca listeyi yenile
            }} 
            onMealAdded={() => { 
                setActiveMealType(null); 
                fetchMeals(); 
            }}
            defaultMealTime={activeMealType} // ÖNEMLİ: Modala hangi öğünü açtığımızı gönderiyoruz
        />
      </main>
      
      {/* Scrollbar Stili (Opsiyonel) */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #e5e7eb; border-radius: 20px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: #d1d5db; }
      `}</style>
    </div>
  );
};

export default MealsPage;