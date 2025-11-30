import React, { useState, useEffect, useRef } from 'react';
import { Send, Plus, MessageSquare, Clock, MoreVertical, Search, Bot, User, ArrowLeft } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import avatarImg from '../assets/avatar.png'; // Avatar görselinin yolu

const AiChatPage = () => {
  // Başlangıç State'i
  const [messages, setMessages] = useState([
    { 
      id: 1, 
      sender: 'bot', 
      text: 'Merhaba! 👋 Ben Paytak AI. Diyetin, öğünlerin veya kalori hedeflerin hakkında bana istediğini sorabilirsin.', 
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      mealData: null
    }
  ]);
  
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null); // null = yeni sohbet modu
  const [loadingHistory, setLoadingHistory] = useState(true);

  // --- API AYARLARI ---
  const API_BASE_URL = 'http://localhost:8000/api'; 

  const getAuthToken = () => localStorage.getItem('userToken');
  
  const getHeaders = () => ({
    'Authorization': `Bearer ${getAuthToken()}`,
    'Content-Type': 'application/json',
  });

  // Otomatik aşağı kaydırma
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Sayfa açılınca geçmişi yükle
  useEffect(() => {
    fetchChatHistory();
  }, []);

  // Seçili sohbet değiştiğinde (Yan menüden tıklanınca) mesajları yükle
  useEffect(() => {
    if (currentChatId) {
      loadChatMessages(currentChatId);
    } 
    // Not: currentChatId null ise (Yeni Sohbet) burası çalışmaz, ekran temiz kalır.
  }, [currentChatId]);

  // --- GEÇMİŞİ ÇEK ---
  const fetchChatHistory = async () => {
    try {
      setLoadingHistory(true);
      const response = await fetch(`${API_BASE_URL}/auth/ai-chat/history/`, {
        headers: getHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        const formattedChats = (data.chats || []).map(chat => ({
          id: chat.id, // Backend'den gelen ID (muhtemelen tarih stringi '2025-11-29')
          title: chat.title || 'Sohbet',
          date: formatChatDate(chat.date),
          messageCount: chat.message_count || 0,
          lastUpdated: chat.last_updated
        }));
        setChatHistory(formattedChats);
      }
    } catch (error) {
      console.error("Geçmiş sohbetler yüklenemedi:", error);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Tarih formatla
  const formatChatDate = (dateStr) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) return 'Bugün';
    if (date.toDateString() === yesterday.toDateString()) return 'Dün';
    return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' });
  };

  // --- MESAJLARI YÜKLE ---
  const loadChatMessages = async (chatId) => {
    try {
      // Ekranı temizlemeden önce yükleniyor gösterebilirsin ama hızlıysa gerek yok
      const response = await fetch(`${API_BASE_URL}/auth/ai-chat/messages/${chatId}/`, {
        headers: getHeaders(),
      });
      
      if (response.ok) {
        const data = await response.json();
        const formattedMessages = [];
        
        (data.messages || []).forEach((msg) => {
          // Kullanıcı mesajı
          formattedMessages.push({
            id: `user-${msg.id}`,
            sender: 'user',
            text: msg.message,
            time: new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            mealData: null
          });
          
          // Bot cevabı
          const parsed = parseMessage(msg.response || '');
          formattedMessages.push({
            id: `bot-${msg.id}`,
            sender: 'bot',
            text: parsed.text,
            time: new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            mealData: parsed.mealData
          });
        });

        // Eğer mesaj varsa yükle, yoksa boş state göster
        if (formattedMessages.length > 0) {
            setMessages(formattedMessages);
        } else {
            handleNewChatUI(); // Mesaj yoksa temizle
        }
      }
    } catch (error) {
      console.error("Mesajlar yüklenemedi:", error);
    }
  };

  const parseMessage = (text) => {
    const regex = /---DATA_START---([\s\S]*?)---DATA_END---/;
    const match = text.match(regex);
    if (match) {
      try {
        const mealData = JSON.parse(match[1].trim());
        return { 
          text: text.replace(regex, '').trim(), 
          mealData: Array.isArray(mealData) ? mealData : [mealData]
        };
      } catch (e) {
        return { text: text, mealData: null };
      }
    }
    return { text: text, mealData: null };
  };

  // --- YENİ SOHBET BAŞLAT ---
  const handleNewChat = () => {
    setCurrentChatId(null); // ID'yi sıfırla
    handleNewChatUI(); // Ekranı temizle
  };

  // Sadece UI'ı temizleyen yardımcı fonksiyon
  const handleNewChatUI = () => {
    setMessages([
      { 
        id: 1, 
        sender: 'bot', 
        text: 'Merhaba! 👋 Ben Paytak AI. Diyetin, öğünlerin veya kalori hedeflerin hakkında bana istediğini sorabilirsin.', 
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        mealData: null
      }
    ]);
  };

  // Saat bazlı öğün
  const getMealTimeByHour = () => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 11) return 'breakfast';
    if (hour >= 11 && hour < 15) return 'lunch';
    if (hour >= 15 && hour < 20) return 'dinner';
    return 'snack';
  };

  // Yemek Ekleme
  const handleAddSuggestedMeal = async (mealData) => {
    try {
      const mealTime = mealData.meal_time || getMealTimeByHour();
      const payload = { ...mealData, quantity: mealData.quantity || 1, date: new Date().toISOString().split('T')[0], meal_time: mealTime };
      
      const res = await fetch(`${API_BASE_URL}/auth/ai-meal-add/`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        setMessages(prev => [...prev, {
          id: Date.now(),
          sender: 'bot',
          text: `✅ ${mealData.food_name} eklendi!`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          mealData: null
        }]);
      } else {
        throw new Error("Hata");
      }
    } catch (e) {
      setMessages(prev => [...prev, {
        id: Date.now(),
        sender: 'bot',
        text: '❌ Bir hata oluştu.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        mealData: null
      }]);
    }
  };

  // --- MESAJ GÖNDERME ---
  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    // 1. Kullanıcı mesajını ekrana bas
    const userMessage = {
      id: Date.now(),
      sender: 'user',
      text: input,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      mealData: null
    };

    setMessages(prev => [...prev, userMessage]);
    const messageToSend = input; 
    setInput(''); 
    setIsTyping(true); 

    try {
      // 2. Backend'e gönder
      const response = await fetch(`${API_BASE_URL}/auth/ai-chat/`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ message: messageToSend })
      });

      const data = await response.json();

      if (response.ok) {
        // 3. Bot cevabını ekrana bas
        const parsed = parseMessage(data.response || "Cevap alınamadı.");
        const botResponse = {
          id: Date.now() + 1,
          sender: 'bot',
          text: parsed.text,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          mealData: parsed.mealData
        };
        setMessages(prev => [...prev, botResponse]);
        
        // --- DÜZELTME BURADA ---
        // Mesaj gönderildikten sonra `currentChatId`'yi hemen güncellemiyoruz.
        // Çünkü backend tarih bazlı çalıştığı için, ID'yi güncellersek 'useEffect' çalışır 
        // ve veritabanındaki eski mesajları (bugünün sabahki mesajları gibi) çekip ekranı bozar.
        // Bunun yerine sadece yan menüyü (history) sessizce güncelliyoruz.
        
        await fetchChatHistory(); 

      } else {
        setMessages(prev => [...prev, { 
          id: Date.now(), sender: 'bot', text: 'Üzgünüm, bir hata oluştu.', time: 'Now', mealData: null 
        }]);
      }

    } catch (error) {
      console.error("Chat hatası:", error);
      setMessages(prev => [...prev, { 
        id: Date.now(), sender: 'bot', text: 'Sunucuya ulaşılamadı.', time: 'Now', mealData: null 
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#F8F9FA] font-sans overflow-hidden dark:bg-gray-950">
      
      {/* Sidebar */}
      <Sidebar />

      {/* Ana İçerik */}
      <main className="flex-1 lg:ml-64 p-4 md:p-6 h-full flex flex-col transition-all duration-300">
        
        {/* Chat Wrapper */}
        <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 flex h-full overflow-hidden relative dark:bg-gray-900 dark:border-gray-800">
            
            {/* --- SOL PANEL: GEÇMİŞ --- */}
            <div className="w-80 border-r border-gray-100 bg-gray-50/50 hidden md:flex flex-col dark:bg-gray-800/40 dark:border-gray-800">
                <div className="p-6 pb-4">
                    <button 
                        onClick={handleNewChat}
                        className="w-full bg-[#6FCF97] hover:bg-[#5dbb85] text-white py-3 rounded-xl font-bold shadow-lg shadow-green-200 transition-all flex items-center justify-center gap-2 mb-6"
                    >
                        <Plus size={20} /> Yeni Sohbet
                    </button>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input type="text" placeholder="Konuşmalarda ara..." className="w-full bg-white border border-gray-200 pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none focus:border-[#6FCF97] transition-colors dark:bg-gray-900 dark:border-gray-700 dark:text-gray-200"/>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2 custom-scrollbar">
                    <p className="text-xs font-bold text-gray-400 px-2 py-2 uppercase tracking-wider">Geçmiş</p>
                    {loadingHistory ? (
                        <div className="text-center py-4 text-gray-400 text-sm">Yükleniyor...</div>
                    ) : chatHistory.length === 0 ? (
                        <div className="text-center py-4 text-gray-400 text-sm">Henüz sohbet yok</div>
                    ) : (
                        chatHistory.map((chat) => (
                            <div 
                                key={chat.id} 
                                onClick={() => setCurrentChatId(chat.id)}
                                className={`p-3 rounded-xl cursor-pointer transition-all flex items-start gap-3 group ${
                                    currentChatId === chat.id 
                                        ? 'bg-white shadow-sm border border-green-100' 
                                        : 'hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-100'
                                }`}
                            >
                                <div className={`p-2 rounded-lg ${
                                    currentChatId === chat.id 
                                        ? 'bg-green-50 text-[#6FCF97]' 
                                        : 'bg-gray-100 text-gray-400 group-hover:text-gray-600 dark:bg-gray-800 dark:text-gray-400 dark:group-hover:text-gray-200'
                                }`}>
                                    <MessageSquare size={18} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className={`text-sm font-bold truncate ${
                                        currentChatId === chat.id ? 'text-gray-800 dark:text-gray-100' : 'text-gray-600 dark:text-gray-300'
                                    }`}>
                                        {chat.title}
                                    </h4>
                                    <div className="flex items-center gap-1 text-[10px] text-gray-400 mt-1">
                                        <Clock size={10} /><span>{chat.date}</span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* --- SAĞ PANEL: CHAT EKRANI --- */}
            <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-900">
                
                {/* Header */}
                <div className="h-20 border-b border-gray-100 flex items-center justify-between px-6 bg-white/80 backdrop-blur-md sticky top-0 z-10 dark:bg-gray-900/80 dark:border-gray-800">
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <div className="w-12 h-12 rounded-full border-2 border-white shadow-md overflow-hidden bg-green-50">
                                <img src={avatarImg} alt="AI" className="w-full h-full object-cover" />
                            </div>
                            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full animate-pulse"></span>
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2 dark:text-gray-100">
                                Paytak AI <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-[10px] font-bold">BETA</span>
                            </h2>
                            <p className="text-xs text-gray-400 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Çevrimiçi
                            </p>
                        </div>
                    </div>
                    <button className="p-2 hover:bg-gray-50 rounded-full text-gray-400 transition-colors dark:hover:bg-gray-800"><MoreVertical size={20} /></button>
                </div>

                {/* Mesaj Alanı */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                    {messages.map((msg) => (
                        <div key={msg.id} className={`flex w-full ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`flex max-w-[85%] md:max-w-[70%] gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 shadow-sm ${msg.sender === 'user' ? 'bg-gray-200 dark:bg-gray-700' : 'bg-green-50 border border-green-100 dark:bg-gray-800 dark:border-gray-700'}`}>
                                    {msg.sender === 'user' ? <User size={16} className="text-gray-500" /> : <Bot size={18} className="text-[#6FCF97]" />}
                                </div>
                                <div>
                                    <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm relative ${msg.sender === 'user' ? 'bg-gradient-to-br from-[#6FCF97] to-[#5dbb85] text-white rounded-tr-none' : 'bg-white border border-gray-100 text-gray-700 rounded-tl-none dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100'}`}>
                                        {msg.text}
                                    </div>
                                    {msg.sender === 'bot' && msg.mealData && (
                                        <div className="mt-2 space-y-2">
                                            {(Array.isArray(msg.mealData) ? msg.mealData : [msg.mealData]).map((item, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => handleAddSuggestedMeal(item)}
                                                    className="text-xs bg-white border border-green-200 text-green-700 px-3 py-2 rounded-xl shadow-sm hover:bg-green-50 block transition-colors w-full text-left"
                                                >
                                                    + Ekle: {item.food_name} ({Math.round(item.calories || 0)} kcal)
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                    <span className={`text-[10px] text-gray-400 mt-1 block ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>{msg.time}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                    {isTyping && (
                        <div className="flex w-full justify-start">
                            <div className="flex gap-3">
                                <div className="w-8 h-8 rounded-full bg-green-50 border border-green-100 flex items-center justify-center mt-1"><Bot size={18} className="text-[#6FCF97]" /></div>
                                <div className="bg-white border border-gray-100 p-4 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-1.5 dark:bg-gray-800 dark:border-gray-700">
                                    <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce"></span><span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce delay-100"></span><span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce delay-200"></span>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Alanı */}
                <div className="p-4 md:p-6 bg-white border-t border-gray-100 dark:bg-gray-900 dark:border-gray-800">
                    <form onSubmit={handleSend} className="relative flex items-center gap-3 max-w-4xl mx-auto">
                        <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Paytak AI'ya bir şeyler sor..." className="flex-1 bg-gray-50 border border-gray-200 text-gray-800 placeholder-gray-400 rounded-2xl py-4 pl-6 pr-14 outline-none focus:bg-white focus:border-[#6FCF97] focus:ring-4 focus:ring-green-50 transition-all shadow-inner dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 dark:placeholder-gray-500"/>
                        <button type="submit" disabled={!input.trim() || isTyping} className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 bg-[#6FCF97] hover:bg-[#5dbb85] text-white rounded-xl shadow-md shadow-green-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-95">
                            <Send size={20} />
                        </button>
                    </form>
                    <p className="text-center text-[10px] text-gray-400 mt-3">Yapay zeka sağlık tavsiyesi verirken hata yapabilir. Lütfen bir uzmana danışın.</p>
                </div>
            </div>
        </div>
      </main>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #e5e7eb; border-radius: 20px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: #d1d5db; }
      `}</style>
    </div>
  );
};

export default AiChatPage;