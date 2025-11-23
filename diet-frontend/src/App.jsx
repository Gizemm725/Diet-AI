import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Giriş Sayfaları */}
          <Route path="/" element={<LoginPage />} />
          <Route path="/login" element={<LoginPage />} />
          
          {/* Kayıt Sayfası */}
          <Route path="/register" element={<RegisterPage />} />
          
          {/* Ana Sayfa Yönlendirmesi */}
          <Route path="/dashboard" element={<ProfilePage />} />

        </Routes>
      </div>
    </Router>
  );
}

export default App;