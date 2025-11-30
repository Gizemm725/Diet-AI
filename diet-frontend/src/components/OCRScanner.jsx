import React, { useState, useRef } from 'react';
import axios from 'axios';
import Alert from './Alert';

const OCRScanner = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [portion, setPortion] = useState(100); // gram cinsinden
  const [toast, setToast] = useState(null); // { type, title, message }

  // Kamera için state'ler
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);

  // 1. KAMERAYI AÇ
  const startCamera = async () => {
    try {
      setIsCameraOpen(true);
      setScanResult(null);
      setSelectedImage(null);
      setPreviewUrl(null);
      
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "environment" } // Arka kamera öncelikli
      });
      
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Kamera açılmadı:", err);
      setToast({ type: 'error', title: 'Kamera', message: 'Kameraya erişilemedi. İzin verdiğinden emin ol.' });
      setIsCameraOpen(false);
    }
  };

  // 2. FOTOĞRAF ÇEK
  const takePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video && canvas) {
      // Canvas boyutunu videoya eşitle
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Videodaki görüntüyü canvas'a çiz
      const context = canvas.getContext('2d');
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Canvas'ı Blob (Dosya) formatına çevir
      canvas.toBlob((blob) => {
        if (blob) {
          // Blob'u File objesine çeviriyoruz ki backend kabul etsin
          const file = new File([blob], "camera_photo.jpg", { type: "image/jpeg" });
          
          setSelectedImage(file);
          setPreviewUrl(URL.createObjectURL(file));
          stopCamera(); // Foto çekince kamerayı kapat
        }
      }, 'image/jpeg');
    }
  };

  // 3. KAMERAYI KAPAT
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop()); // Kamerayı durdur
    }
    setStream(null);
    setIsCameraOpen(false);
  };

  // 4. DOSYA YÜKLEME (Klasik yöntem)
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
      setScanResult(null);
      stopCamera(); // Eğer kamera açıksa kapat
    }
  };

  // 5. ANALİZ ET (Backend'e Gönder)
  const handleAnalyze = async () => {
    if (!selectedImage) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('image', selectedImage);

    try {
      const token = localStorage.getItem('userToken'); 
      const response = await axios.post('http://localhost:8000/api/auth/analyze-food-image/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}` 
        }
      });

      if (response.data.status === 'success') {
        setScanResult(response.data.data);
        setPortion(100);
        setToast({ type: 'success', title: 'Analiz tamam', message: 'Etiket başarıyla okundu.' });
      } else {
        setToast({ type: 'error', title: 'Analiz', message: 'Analiz başarısız oldu.' });
      }
    } catch (error) {
      console.error("Analiz hatası:", error);
      setToast({ type: 'error', title: 'Hata', message: error.response?.data?.error || 'Hata oluştu. Lütfen tekrar deneyin.' });
    } finally {
      setLoading(false);
    }
  };

  // 6. GÜNLÜĞE EKLE
  const handleSaveToDiary = async () => {
    if (!scanResult) return;
    try {
      const token = localStorage.getItem('userToken');
      // porsiyonu 100g baz değerine göre ölçekle
      const scale = (portion || 100) / 100;
      const baseCalories = parseFloat(scanResult.calories) || 0;
      const baseProtein  = parseFloat(scanResult.protein)  || 0;
      const baseCarbs    = parseFloat(scanResult.carbs)    || 0;
      const baseFat      = parseFloat(scanResult.fat)      || 0;
      const scaled = {
        ...scanResult,
        calories: baseCalories * scale,
        protein:  baseProtein  * scale,
        carbs:    baseCarbs    * scale,
        fat:      baseFat      * scale,
      };
      const payload = {
        foods: [scaled],
        meal_time: 'snack',
        date: new Date().toISOString().split('T')[0]
      };
      const response = await axios.post('http://localhost:8000/api/auth/ai-meal-add/', payload, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      setToast({ type: 'success', title: 'Günlük', message: 'Kaydedildi ✅' });
      setScanResult(null);
      setSelectedImage(null);
      setPreviewUrl(null);
    } catch (error) {
      console.error(error);
      setToast({ type: 'error', title: 'Günlük', message: error.response?.data?.error || 'Kaydedilemedi. Lütfen tekrar deneyin.' });
    }
  };

  return (
    <div className="p-4 border rounded-lg shadow-md max-w-md mx-auto bg-white mt-10 dark:bg-gray-900 dark:border-gray-800">
      {toast && (
        <div className="mb-3">
          <Alert type={toast.type} title={toast.title} onClose={() => setToast(null)}>
            {toast.message}
          </Alert>
        </div>
      )}
      <h2 className="text-xl font-bold mb-4 text-center dark:text-white">Besin Etiketi Oku 📋</h2>
      <p className="text-sm text-gray-600 text-center mb-4 dark:text-gray-300">
        Besin etiketinin fotoğrafını çek veya yükle. AI, etiket üzerindeki besin değerlerini (kalori, protein, karbonhidrat, yağ) otomatik olarak okuyacak.
      </p>

      {/* Butonlar: Kamera vs Dosya */}
      <div className="flex gap-2 mb-4 justify-center">
        {!isCameraOpen && (
          <button 
            onClick={startCamera}
            className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
          >
            📸 Kamerayı Aç
          </button>
        )}
        
        <label className="bg-gray-200 text-gray-700 px-4 py-2 rounded cursor-pointer hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700">
          📁 Dosya Yükle
          <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
        </label>
      </div>

      {/* Kamera Görüntüsü (Canlı) */}
      <div className="relative">
        {isCameraOpen && (
          <div className="mb-4 text-center bg-black rounded-lg overflow-hidden">
            <video ref={videoRef} autoPlay playsInline className="w-full h-64 object-cover" />
            <button 
              onClick={takePhoto}
              className="mt-2 mb-2 bg-red-600 text-white px-6 py-2 rounded-full font-bold hover:bg-red-700"
            >
              ÇEK
            </button>
            <button 
              onClick={stopCamera}
              className="absolute top-2 right-2 bg-gray-800 text-white p-1 rounded-full text-xs"
            >
              ✖
            </button>
          </div>
        )}
        {/* Gizli Canvas (Fotoğrafı dondurmak için gerekli) */}
        <canvas ref={canvasRef} className="hidden"></canvas>
      </div>

      {/* Çekilen/Seçilen Resim Önizleme */}
      {previewUrl && !isCameraOpen && (
        <div className="mb-4 text-center">
          <img src={previewUrl} alt="Seçilen" className="h-48 mx-auto rounded-md object-cover border dark:border-gray-700" />

          {/* Porsiyon Slider */}
          <div className="mt-4 text-left">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Porsiyon: {portion}g</label>
            <input type="range" min="50" max="500" step="10" value={portion} onChange={(e)=>setPortion(parseInt(e.target.value))} className="w-full accent-[#6FCF97]" />
            <p className="text-xs text-gray-500 mt-1 dark:text-gray-400">Değerler 100g baz alınarak ölçeklenir.</p>
          </div>

          <button 
            onClick={handleAnalyze} 
            disabled={loading}
            className={`mt-2 w-full py-2 px-4 rounded text-white font-bold ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            {loading ? '⏳ Etiket Okunuyor...' : '📋 Etiketi Oku'}
          </button>
        </div>
      )}

      {/* Sonuç Alanı */}
      {scanResult && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg animate-fade-in dark:bg-green-900/20 dark:border-green-800/40">
          <div className="mb-2">
            <span className="text-xs text-gray-500">{portion} gram için:</span>
            <h3 className="font-bold text-lg text-green-800">{scanResult.food_name}</h3>
          </div>
          <ul className="mt-2 text-sm space-y-1">
            <li className="flex justify-between">
              <span>🔥 Kalori:</span>
              <span className="font-semibold">{Math.round(((parseFloat(scanResult.calories) || 0) * (portion/100)))} kcal</span>

            </li>
            <li className="flex justify-between">
              <span>🥩 Protein:</span>
              <span className="font-semibold">{Math.round(((parseFloat(scanResult.protein) || 0) * (portion/100)))}g</span>

            </li>
            <li className="flex justify-between">
              <span>🍞 Karbonhidrat:</span>
              <span className="font-semibold">{Math.round(((parseFloat(scanResult.carbs) || 0) * (portion/100)))}g</span>

            </li>
            <li className="flex justify-between">
              <span>🥑 Yağ:</span>
              <span className="font-semibold">{Math.round(((parseFloat(scanResult.fat) || 0) * (portion/100)))}g</span>

            </li>
          </ul>
          <button 
            onClick={handleSaveToDiary}
            className="mt-4 w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded font-semibold transition-colors"
          >
            ✅ Günlüğe Ekle
          </button>
        </div>
      )}
    </div>
  );
};

export default OCRScanner;