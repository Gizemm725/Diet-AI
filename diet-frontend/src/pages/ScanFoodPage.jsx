// src/pages/ScanFoodPage.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import OCRScanner from '../components/OCRScanner';
import Sidebar from '../components/Sidebar';
import avatarImg from '../assets/avatar.png'; // Avatar görselini buraya da ekledik (Yoksa placeholder kullanır)

const ScanFoodPage = () => {
  return (
    // 1. ANA ARKA PLAN RENGİ: ProfilePage ile aynı gradyan
    <div className="flex min-h-screen bg-gradient-to-br from-[#EBF7EE] to-[#F7FBF9] font-sans dark:from-gray-900 dark:to-gray-950">
      
      {/* Sidebar */}
      <Sidebar />

      {/* Ana İçerik */}
      <main className="flex-1 lg:ml-64 p-6 md:p-8 h-full flex flex-col transition-all duration-300">
        
        {/* --- HEADER (Profile Sayfasıyla Aynı) --- */}
        <header className="flex justify-between items-center mb-6">
            
            <div className="flex items-center gap-4 ml-auto">
                <button className="w-10 h-10 bg-white rounded-full border border-gray-100 flex items-center justify-center shadow-sm relative hover:bg-gray-50 transition-colors dark:bg-gray-900 dark:border-gray-800 dark:hover:bg-gray-800">
                    🔔 <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-orange-500 rounded-full border-2 border-white"></span>
                </button>
                <Link to="/profile" className="flex items-center gap-3 bg-white pl-2 pr-4 py-1.5 rounded-full border border-gray-100 shadow-sm hover:shadow-md transition-all dark:bg-gray-900 dark:border-gray-800">
                    <img src={avatarImg} alt="User" className="w-8 h-8 rounded-full object-cover border-2 border-green-100" />
                    {/* Buradaki isim dinamik değilse statik kalabilir veya context'ten çekilebilir */}
                    <span className="text-sm font-bold text-gray-700 dark:text-gray-200">Hesabım</span>
                </Link>
            </div>
        </header>

        {/* --- SCANNER KART ALANI --- */}
        <div className="flex-1">
             {/* Profile sayfasındaki "Karşılama Bannerı" tarzında bir kapsayıcı */}
            <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-6 md:p-10 h-full flex flex-col relative overflow-hidden dark:bg-gray-900 dark:border-gray-800">
                
                {/* Dekoratif Arka Plan Işıkları (ProfilePage ile uyumlu) */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-orange-100/40 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none dark:hidden"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-green-50/50 rounded-full blur-3xl -ml-10 -mb-10 pointer-events-none dark:hidden"></div>

                {/* Başlık ve Açıklama Kısmı */}
                <div className="relative z-10 text-center max-w-2xl mx-auto mb-8">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-50 border border-green-100 mb-3">
                         <span className="text-xl">📸</span>
                         <span className="text-xs font-bold text-green-600 tracking-wide uppercase">AI Destekli Tarayıcı</span>
                    </div>

                    <h1 className="text-3xl font-extrabold text-gray-800 mb-3 dark:text-white">
                        Besin Etiketi <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2F5E41] to-[#6FCF97]">Okuyucu</span>
                    </h1>
                    
                    <p className="text-gray-500 text-sm leading-relaxed dark:text-gray-300">
                        Market alışverişinde veya mutfağında paketli ürünlerin arkasındaki besin değerlerini (Karbonhidrat, Protein, Yağ) otomatik olarak algıla ve günlüğüne ekle.
                    </p>
                </div>

                {/* OCR Component Alanı */}
                {/* Bu kısma özel bir çerçeve ve stil ekleyerek componentin havada durmasını engelliyoruz */}
                <div className="relative z-10 flex-1 w-full max-w-4xl mx-auto bg-gray-50 rounded-3xl border border-dashed border-gray-200 p-4 md:p-6 flex flex-col justify-center items-center dark:bg-gray-800/50 dark:border-gray-700">
                    <OCRScanner />
                </div>

            </div>
        </div>

      </main>
    </div>
  );
};

export default ScanFoodPage;