import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ChatInterface from '../components/ChatInterface';
import ChatHistorySidebar from '../components/ChatHistorySidebar';
import Sidebar from '../components/Sidebar';

const ChatPage = () => {
  const navigate = useNavigate();
  const [currentChatId, setCurrentChatId] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleSelectChat = (chatId) => {
    setCurrentChatId(chatId);
  };

  const handleNewChat = () => {
    setCurrentChatId(null);
  };

  const handleChatUpdated = () => {
    // Yeni mesaj gönderildiğinde chat history'yi yenile
    setRefreshKey(prev => prev + 1);
  };

  const handleLogout = () => {
    localStorage.removeItem('userToken');
    navigate('/login');
  };

  return (
    <div className="layout">
      <Sidebar />
      <div className="page" style={{ display: 'flex', flexDirection: 'column' }}>
        <h2 className="page-header">Sohbet</h2>
        <div style={{ display: 'flex', flex: 1, gap: 0 }}>
          <ChatHistorySidebar
            key={refreshKey}
            onSelectChat={handleSelectChat}
            currentChatId={currentChatId}
            onNewChat={handleNewChat}
          />
          <div className="chat-main">
            <ChatInterface
              fullHeight
              chatId={currentChatId}
              onChatLoaded={setCurrentChatId}
              onMessageSent={handleChatUpdated}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;