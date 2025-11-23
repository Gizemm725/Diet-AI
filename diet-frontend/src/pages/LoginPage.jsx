import React, { useState, useEffect } from 'react'; // 1. useEffect'i buraya ekledik
import { Link, useNavigate } from 'react-router-dom';
import { loginUser } from '../services/api';

// Maskot resmini buraya import et
import loginMascot from '../assets/maskot-ozet.png'; 

function LoginPage() {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // --- 🆕 YENİ EKLENEN KISIM: OTOMATİK YÖNLENDİRME ---
  useEffect(() => {
    // 1. Dedektif iş başında: LocalStorage'a bak
    const token = localStorage.getItem('userToken');

    // 2. Eğer token varsa, bu kullanıcı zaten içeridedir.
    if (token) {
      // 3. Hiç bekleme yapma, direkt Dashboard'a gönder
      navigate('/dashboard');
    }
  }, [navigate]); // Bu kod sadece sayfa ilk yüklendiğinde 1 kere çalışır
  // ----------------------------------------------------

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // api.js'deki loginUser fonksiyonunu çağırıyoruz
      // Not: api.js'de "await" olduğu için burada cevap gelene kadar bekler (Loading döner)
      const response = await loginUser(formData);
      
      let accessToken = null;

      // Token ayrıştırma mantığın
      if (typeof response === 'string' && response.startsWith('ey')) {
          accessToken = response;
      }
      else if (response.data && typeof response.data === 'string') {
          accessToken = response.data;
      }
      else {
          accessToken = response.data?.tokens?.access || 
                        response.tokens?.access || 
                        response.access || 
                        response.token;
      }

      if (accessToken) {
        const cleanToken = accessToken.replace(/"/g, '');
        localStorage.setItem('userToken', cleanToken);
        
        // Başarılı girişten sonra yönlendirme
        navigate('/dashboard');
      } else {
        setError("Sunucudan gelen cevap işlenemedi.");
      }

    } catch (error) {
      console.error('Giriş hatası:', error);
      let errorMessage = 'Giriş başarısız oldu.';
      if (error.response?.data?.detail) errorMessage = error.response.data.detail;
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7FBF9] flex items-center justify-center p-4 relative overflow-hidden font-sans">
      
      {/* --- ARKA PLAN EFEKTLERİ --- */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-[#A8D5BA] rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
      <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-[#D8B4FE] rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-[#A8D5BA] rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>

      {/* --- ANA KONTEYNER --- */}
      <div className="relative w-full max-w-md">
        
        {/* Dekoratif Arka Katman */}
        <div className="absolute top-4 left-4 w-full h-full bg-[#A8D5BA] rounded-3xl -z-10 opacity-40 transform rotate-2"></div>
        <div className="absolute top-4 left-4 w-full h-full bg-[#A8D5BA] rounded-3xl -z-20 opacity-20 transform -rotate-2 blur-sm"></div>

        {/* --- BEYAZ KART --- */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8 border border-white/50">
          
          {/* Header & Maskot */}
          <div className="flex flex-col items-center mb-6">
            <div className="w-24 h-24 bg-[#E8F5E9] rounded-full flex items-center justify-center mb-4 shadow-inner border-4 border-white">
                <img src={loginMascot} alt="Mascot" className="w-20 h-20 object-contain drop-shadow-md" />
            </div>
            <h2 className="text-3xl font-bold text-gray-800 tracking-tight">Tekrar Hoş Geldin!</h2>
            <p className="text-gray-500 text-sm mt-1">Sağlıklı yaşam serüvenine devam et 🌿</p>
          </div>

          {/* Hata Mesajı */}
          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-100 rounded-xl text-red-500 text-sm flex items-center gap-2 animate-pulse">
              <span>⚠️</span> {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Kullanıcı Adı</label>
              <input
                name="username"
                type="text"
                value={formData.username}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-[#A8D5BA]/30 focus:border-[#A8D5BA] transition-all outline-none text-gray-700 placeholder-gray-400"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Şifre</label>
              <input
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-[#A8D5BA]/30 focus:border-[#A8D5BA] transition-all outline-none text-gray-700 placeholder-gray-400"
              />
            </div>

            {/* Buton */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-[#A8D5BA] hover:bg-[#96C9AD] text-white font-bold rounded-xl shadow-lg shadow-green-100 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2 mt-4"
            >
              {loading ? <span className="animate-spin">⌛</span> : 'Giriş Yap'}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-gray-500 text-sm">
              Henüz üye değil misin?{' '}
              <Link to="/register" className="font-bold text-[#86C5A0] hover:text-[#6BAF8A] transition-colors underline decoration-2 decoration-transparent hover:decoration-[#86C5A0]">
                Hemen Başla
              </Link>
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
      `}</style>
    </div>
  );
}

export default LoginPage;