import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import UserProfilePage from './pages/UserProfilePage';
import MealsPage from './pages/MealsPage';
import AiChatPage from './pages/AiChatPage';
import ScanFoodPage from './pages/ScanFoodPage'; // <-- BU SATIRI EKLE

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Giriş Sayfaları */}
          <Route path="/" element={<LoginPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/chat" element={<AiChatPage />} />
          {/* Kayıt Sayfası */}
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/profile" element={<UserProfilePage />} />
          {/* Ana Sayfa Yönlendirmesi */}
          <Route path="/dashboard" element={<ProfilePage />} />
          <Route path="/meals" element={<MealsPage />} />
          <Route path="/scan" element={<ScanFoodPage />} />
          
        </Routes>
      </div>
    </Router>
  );
}

export default App;