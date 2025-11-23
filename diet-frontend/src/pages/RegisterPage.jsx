import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerUser } from '../services/api';

// Maskot resmi (Register için farklı bir poz varsa onu koyabilirsin)
import registerMascot from '../assets/maskot-hedef.png'; 

function RegisterPage() {
  const [step, setStep] = useState(1);
  const navigate = useNavigate();

  const [basicData, setBasicData] = useState({
    username: '', email: '', first_name: '', last_name: '', password: '', password_confirm: '',
  });

  const [profileData, setProfileData] = useState({
    age: '', weight: '', height: '', goal: 'healthy_eating', activity_level: 'moderate',
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // ... (Senin options dizilerin buraya gelecek: goalOptions, activityOptions) ...
  const goalOptions = [
    { value: 'lose_weight', label: 'Kilo Vermek' },
    { value: 'gain_weight', label: 'Kilo Almak' },
    { value: 'healthy_eating', label: 'Sağlıklı Beslenmek' },
    { value: 'athlete', label: 'Sporcu' },
    { value: 'maintain', label: 'Kilo Korumak' },
  ];

  const activityOptions = [
    { value: 'sedentary', label: 'Hareketsiz' },
    { value: 'light', label: 'Hafif Aktif' },
    { value: 'moderate', label: 'Orta Aktif' },
    { value: 'active', label: 'Aktif' },
    { value: 'very_active', label: 'Çok Aktif' },
  ];

  const handleBasicChange = (e) => {
    setBasicData({ ...basicData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleProfileChange = (e) => {
    setProfileData({ ...profileData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleBasicSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (basicData.password !== basicData.password_confirm) { setError('Şifreler eşleşmiyor!'); return; }
    if (basicData.password.length < 8) { setError('Şifre en az 8 karakter olmalı!'); return; }
    setStep(2);
  };

  const handleFinalSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const finalPayload = {
        ...basicData,
        ...profileData,
        age: parseInt(profileData.age),
        weight: parseFloat(profileData.weight),
        height: parseFloat(profileData.height)
      };
      const response = await registerUser(finalPayload);
      if (response.tokens?.access) localStorage.setItem('userToken', response.tokens.access);
      else if (response.access) localStorage.setItem('userToken', response.access);
      
      // Başarılı olursa login'e veya dashboard'a
      navigate('/dashboard'); 
    } catch (error) {
       console.error(error);
       setError('Kayıt başarısız. Lütfen bilgileri kontrol et.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7FBF9] flex items-center justify-center p-4 relative overflow-hidden font-sans">
      
      {/* Background Blobs (Soft) */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-[#A8D5BA] rounded-full mix-blend-multiply blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute top-[20%] right-[-10%] w-80 h-80 bg-[#E9D5FF] rounded-full mix-blend-multiply blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
      </div>

      <div className="relative w-full max-w-2xl">
        
        {/* --- DEKORATİF ARKA KATMAN (Senin isteğin) --- */}
        <div className="absolute top-4 left-4 w-full h-full bg-[#A8D5BA] rounded-[2.5rem] -z-10 opacity-40 transform rotate-1"></div>

        {/* --- ANA KART --- */}
        <div className="bg-white/90 backdrop-blur-md rounded-[2.5rem] shadow-xl border border-white p-8 md:p-10">
          
          {/* Header */}
          <div className="text-center mb-8 relative">
             <img src={registerMascot} alt="Mascot" className="w-16 h-16 object-contain mx-auto mb-2 absolute -top-16 left-0 right-0 animate-bounce" style={{animationDuration: '3s'}} />
             
            <h2 className="text-3xl font-bold text-gray-800 mt-4">Aramıza Katıl</h2>
            <p className="text-gray-500 text-sm">Sana özel diyet planı için birkaç soru</p>
            
            {/* Step Indicator (Modern Hap Tasarım) */}
            <div className="flex justify-center mt-6 gap-2">
                <div className={`h-2 rounded-full transition-all duration-500 ${step === 1 ? 'w-12 bg-[#A8D5BA]' : 'w-4 bg-gray-200'}`}></div>
                <div className={`h-2 rounded-full transition-all duration-500 ${step === 2 ? 'w-12 bg-[#A8D5BA]' : 'w-4 bg-gray-200'}`}></div>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-100 rounded-xl text-red-500 text-sm text-center">
              {error}
            </div>
          )}

          {step === 1 && (
            <form onSubmit={handleBasicSubmit} className="space-y-4 animate-fade-in">
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 ml-1">Ad</label>
                    <input name="first_name" required value={basicData.first_name} onChange={handleBasicChange} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#A8D5BA] outline-none transition-all" placeholder="Adın" />
                 </div>
                 <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 ml-1">Soyad</label>
                    <input name="last_name" required value={basicData.last_name} onChange={handleBasicChange} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#A8D5BA] outline-none transition-all" placeholder="Soyadın" />
                 </div>
              </div>
              
              <div className="space-y-1">
                 <label className="text-xs font-bold text-gray-500 ml-1">Kullanıcı Adı</label>
                 <input name="username" required value={basicData.username} onChange={handleBasicChange} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#A8D5BA] outline-none transition-all" placeholder="Kullanıcı adı seç" />
              </div>

              <div className="space-y-1">
                 <label className="text-xs font-bold text-gray-500 ml-1">E-posta</label>
                 <input name="email" type="email" required value={basicData.email} onChange={handleBasicChange} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#A8D5BA] outline-none transition-all" placeholder="E-posta adresin" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 ml-1">Şifre</label>
                    <input name="password" type="password" required value={basicData.password} onChange={handleBasicChange} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#A8D5BA] outline-none transition-all" placeholder="******" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 ml-1">Şifre Tekrar</label>
                    <input name="password_confirm" type="password" required value={basicData.password_confirm} onChange={handleBasicChange} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#A8D5BA] outline-none transition-all" placeholder="******" />
                  </div>
              </div>

              <button type="submit" className="w-full py-4 bg-[#A8D5BA] hover:bg-[#96C9AD] text-white font-bold rounded-xl shadow-md transition-all mt-2">
                Devam Et →
              </button>
              
              <p className="text-center text-sm text-gray-500 mt-4">
                Hesabın var mı? <Link to="/login" className="text-[#86C5A0] font-bold hover:underline">Giriş Yap</Link>
              </p>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleFinalSubmit} className="space-y-4 animate-fade-in">
               <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 ml-1">Yaş</label>
                    <input name="age" type="number" required value={profileData.age} onChange={handleProfileChange} className="w-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#A8D5BA] outline-none" placeholder="25" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 ml-1">Boy (cm)</label>
                    <input name="height" type="number" required value={profileData.height} onChange={handleProfileChange} className="w-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#A8D5BA] outline-none" placeholder="170" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 ml-1">Kilo (kg)</label>
                    <input name="weight" type="number" required value={profileData.weight} onChange={handleProfileChange} className="w-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#A8D5BA] outline-none" placeholder="65" />
                  </div>
               </div>

               <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 ml-1">Hedefin</label>
                  <select name="goal" value={profileData.goal} onChange={handleProfileChange} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#A8D5BA] outline-none">
                     {goalOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
               </div>

               <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 ml-1">Hareket Durumu</label>
                  <select name="activity_level" value={profileData.activity_level} onChange={handleProfileChange} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#A8D5BA] outline-none">
                     {activityOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
               </div>

               <div className="flex gap-3 mt-4">
                 <button type="button" onClick={() => setStep(1)} className="flex-1 py-4 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold rounded-xl transition-all">
                   ← Geri
                 </button>
                 <button type="submit" disabled={loading} className="flex-[2] py-4 bg-[#A8D5BA] hover:bg-[#96C9AD] text-white font-bold rounded-xl shadow-lg transition-all">
                   {loading ? '...' : 'Kaydı Tamamla ✨'}
                 </button>
               </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}

export default RegisterPage;