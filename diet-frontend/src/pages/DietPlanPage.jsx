import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCustomPlans, searchFoods, addMeal, getMeals } from '../services/api';
import Sidebar from '../components/Sidebar';

const DietPlanPage = () => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [selectedFood, setSelectedFood] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [mealTime, setMealTime] = useState('snack');
  const [note, setNote] = useState('');
  const [todayMeals, setTodayMeals] = useState([]);
  const [adding, setAdding] = useState(false);

  // YYYY-MM-DD (local timezone)
  const localDateStr = () => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  useEffect(() => {
    const token = localStorage.getItem('userToken');
    if (!token) {
      navigate('/login');
      return;
    }

    (async () => {
      try {
        const data = await getCustomPlans();
        setPlans(Array.isArray(data) ? data : (data.results || []));
        const today = localDateStr();
        const meals = await getMeals(today);
        setTodayMeals(Array.isArray(meals) ? meals : (meals.results || []));
      } catch (err) {
        setError('Diyet planı verileri yüklenemedi.');
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate]);

  // Autocomplete arama
  useEffect(() => {
    const controller = new AbortController();
    const t = setTimeout(async () => {
      try {
        if (query.trim().length < 2) { setSuggestions([]); return; }
        const data = await searchFoods(query.trim());
        setSuggestions(Array.isArray(data) ? data.slice(0,8) : (data.results || []).slice(0,8));
      } catch {
        setSuggestions([]);
      }
    }, 250);
    return () => { clearTimeout(t); controller.abort(); };
  }, [query]);

  const handleSelectFood = (food) => {
    setSelectedFood(food);
    setQuery(food.name);
    setSuggestions([]);
  };

  const handleAddMeal = async (e) => {
    e.preventDefault();
    if (!selectedFood) return;
    setAdding(true);
    try {
      const today = localDateStr();
      await addMeal({
        food_id: selectedFood.id,
        quantity: Number(quantity) || 1,
        meal_time: mealTime,
        notes: note,
        date: today,
      });
      // Temizle ve bugünkü öğünleri yenile
      setNote('');
      setQuantity(1);
      setMealTime('snack');
      setSelectedFood(null);
      setQuery('');
      const meals = await getMeals(today);
      setTodayMeals(Array.isArray(meals) ? meals : (meals.results || []));
      // Diğer sayfalara (Profil) bildirim gönder
      window.dispatchEvent(new Event('meals:updated'));
    } catch (err) {
      setError('Öğün eklenemedi. Lütfen tekrar deneyin.');
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="layout">
      <Sidebar />
      <div className="page">
        <h2 className="page-header">Diyet Planı</h2>
        {loading && <p className="muted">Yükleniyor...</p>}
        {error && <p style={{ color: 'salmon' }}>{error}</p>}

        <div className="grid grid-cards mt-16">
          {plans.map((plan) => (
            <div key={plan.id || plan.pk} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="card-title">{plan.name || 'Özel Plan'}</div>
                {plan.is_active && (
                  <span className="badge">Aktif</span>
                )}
              </div>
              {plan.description && <div className="muted mb-8">{plan.description}</div>}
              <div className="grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                <div><strong>Toplam Kalori:</strong> {plan.total_calories ?? '-'} kcal</div>
                <div><strong>Protein:</strong> {plan.total_protein ?? '-'} g</div>
                <div><strong>Karbonhidrat:</strong> {plan.total_carbs ?? '-'} g</div>
                <div><strong>Yağ:</strong> {plan.total_fat ?? '-'} g</div>
              </div>
            </div>
          ))}
        </div>

        {/* Bugün Ne Yedim - Ekleme Alanı */}
        <div style={{ marginTop: 20, display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
          <div className="card">
            <div className="card-title">Bugün Ne Yedim?</div>
            <form onSubmit={handleAddMeal} style={{ display: 'grid', gridTemplateColumns: '1fr 120px 160px', gap: 12, alignItems: 'start' }}>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => { setQuery(e.target.value); setSelectedFood(null); }}
                  placeholder="Besin ara (örn. 'elma', 'yoğurt')"
                  className="input"
                />
                {suggestions.length > 0 && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #e5e7eb', borderTop: 'none', zIndex: 10, maxHeight: 260, overflowY: 'auto', borderBottomLeftRadius: 8, borderBottomRightRadius: 8 }}>
                    {suggestions.map((s) => (
                      <div key={s.id} onClick={() => handleSelectFood(s)} style={{ padding: 10, cursor: 'pointer', display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#111827' }}>{s.name}</span>
                        <span style={{ color: '#6b7280' }}>{s.calories} kcal</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input type="number" min="0.1" step="0.1" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="Miktar" className="input" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8 }}>
                <select value={mealTime} onChange={(e) => setMealTime(e.target.value)} className="select">
                  <option value="breakfast">Kahvaltı</option>
                  <option value="lunch">Öğle</option>
                  <option value="dinner">Akşam</option>
                  <option value="snack">Atıştırmalık</option>
                </select>
                <input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Not (opsiyonel)" className="input" />
                <button type="submit" disabled={!selectedFood || adding} className="btn btn-primary">
                  {adding ? 'Ekleniyor...' : 'Ekle'}
                </button>
              </div>
            </form>
          </div>

          <div className="card">
            <div className="card-title">Bugün Yediklerim</div>
            {todayMeals.length === 0 ? (
              <div className="muted">Bugün için öğün eklenmemiş.</div>
            ) : (
              <div className="grid grid-auto mt-12">
                {todayMeals.map((m) => (
                  <div key={m.id} className="card">
                    <div style={{ fontWeight: 700, marginBottom: 4 }}>{m.food_name || m.food?.name}</div>
                    <div className="muted">Miktar: {m.quantity}</div>
                    <div className="muted">Kalori: {m.food_calories ? (m.food_calories * m.quantity).toFixed(0) : m.calories}</div>
                    <div className="muted" style={{ fontSize: 12 }}>{m.meal_time}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DietPlanPage;





