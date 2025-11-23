import React, { useState, useEffect } from 'react';

const AddMealModal = ({ isOpen, onClose, onMealAdded }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedFood, setSelectedFood] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [mealTime, setMealTime] = useState('lunch');
  const [message, setMessage] = useState('');

  // Backend yapısına uygun URL
  const API_BASE_URL = 'http://localhost:8000/api/auth';

  const getAuthToken = () => localStorage.getItem('userToken');

  const getHeaders = () => {
    const token = getAuthToken();
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  };

  // Yemek Arama Fonksiyonu
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchTerm.length > 1) {
        searchFoods();
      } else {
        setSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const searchFoods = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/foods/?search=${searchTerm}`, {
        headers: getHeaders(),
      });
      
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.results || data);
      } else {
        console.error("Arama başarısız:", response.status);
      }
    } catch (error) {
      console.error("Arama hatası:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMeal = async () => {
    if (!selectedFood) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      
      const payload = {
        food_id: selectedFood.id,
        quantity: parseFloat(quantity),
        meal_time: mealTime,
        date: today
      };

      const response = await fetch(`${API_BASE_URL}/add-meal/`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        setMessage('Öğün başarıyla eklendi! ✅');
        setTimeout(() => {
          setMessage('');
          onClose();
          if (onMealAdded) onMealAdded();
        }, 1000);
      } else {
        setMessage('Hata oluştu ❌');
      }
    } catch (error) {
      console.error("Ekleme hatası:", error);
      setMessage('Sunucu hatası ❌');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 backdrop-blur-sm p-4">
      {/* Modal Kartı - Yuvarlatılmış köşeler artırıldı ve border kaldırıldı */}
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all relative">
        
        {/* Header - Artık beyaz ve yazı siyah */}
        <div className="pt-6 px-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Öğün Ekle</h2>
            <p className="text-sm text-gray-500">Bugün ne yedin?</p>
          </div>
          <button 
            onClick={onClose} 
            className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* 1. Adım: Arama */}
          {!selectedFood ? (
            <div className="space-y-4">
              <div className="relative">
                {/* Arama İkonu */}
                <span className="absolute left-4 top-3.5 text-gray-400">🔍</span>
                <input
                  type="text"
                  placeholder="Örn: Tavuk, Elma, Pilav..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  // Input stili güncellendi: Yazı rengi siyah yapıldı
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-gray-800 placeholder-gray-400 focus:border-green-400 focus:ring-2 focus:ring-green-100 outline-none transition-all"
                  autoFocus
                />
              </div>

              {/* Sonuç Listesi */}
              <div className="max-h-64 overflow-y-auto space-y-2 custom-scrollbar">
                {loading ? (
                  <div className="text-center py-4 text-gray-500">Aranıyor...</div>
                ) : searchResults.length > 0 ? (
                  searchResults.map((food) => (
                    <div
                      key={food.id}
                      onClick={() => setSelectedFood(food)}
                      className="flex justify-between items-center p-3 hover:bg-green-50 rounded-2xl cursor-pointer border border-transparent hover:border-green-200 transition-all group"
                    >
                      <div>
                        <p className="font-bold text-gray-800">{food.name}</p>
                        <p className="text-xs text-gray-500">{food.calories} kcal / porsiyon</p>
                      </div>
                      <div className="w-8 h-8 flex items-center justify-center bg-green-100 text-green-600 rounded-full group-hover:bg-green-500 group-hover:text-white transition-colors">
                        +
                      </div>
                    </div>
                  ))
                ) : searchTerm.length > 1 ? (
                  <div className="text-center py-8">
                     <p className="text-4xl mb-2">🥗</p>
                     <p className="text-gray-400">Sonuç bulunamadı</p>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400 text-sm">
                    Aramak için yazmaya başlayın
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* 2. Adım: Detaylar */
            <div className="space-y-6 animate-fadeIn">
              {/* Seçilen Yemek Kartı */}
              <div className="flex justify-between items-center bg-green-50 p-4 rounded-2xl border border-green-100">
                <div>
                  <h3 className="font-bold text-lg text-gray-800">{selectedFood.name}</h3>
                  <p className="text-sm text-green-700 font-medium">{selectedFood.calories} kcal (1 porsiyon)</p>
                </div>
                <button 
                  onClick={() => setSelectedFood(null)}
                  className="bg-white text-gray-500 hover:text-red-500 px-3 py-1.5 rounded-lg text-sm font-medium shadow-sm transition-colors"
                >
                  Değiştir
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Miktar</label>
                  <input
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 focus:ring-green-400 focus:border-green-400 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Öğün</label>
                  <div className="relative">
                    <select
                      value={mealTime}
                      onChange={(e) => setMealTime(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 focus:ring-green-400 focus:border-green-400 outline-none appearance-none"
                    >
                      <option value="breakfast">Kahvaltı ☀️</option>
                      <option value="lunch">Öğle Yemeği 🌤️</option>
                      <option value="dinner">Akşam Yemeği 🌙</option>
                      <option value="snack">Atıştırmalık 🍪</option>
                    </select>
                    <div className="absolute right-3 top-3.5 pointer-events-none text-gray-500">▼</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-2xl text-center">
                <p className="text-sm text-gray-500 mb-1">Toplam Kalori</p>
                <p className="font-extrabold text-gray-800 text-3xl">
                  {Math.round(selectedFood.calories * quantity)} <span className="text-sm text-green-500 font-medium">kcal</span>
                </p>
              </div>

              <button
                onClick={handleAddMeal}
                className="w-full py-4 bg-[#6FCF97] hover:bg-[#5dbb85] text-white font-bold text-lg rounded-2xl shadow-green-200 shadow-lg hover:shadow-xl transition-all transform active:scale-95"
              >
                Öğünü Kaydet
              </button>
              
              {message && (
                <p className="text-center text-sm font-bold text-green-600 animate-pulse bg-green-50 py-2 rounded-lg">
                  {message}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default AddMealModal;