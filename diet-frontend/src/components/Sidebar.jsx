import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';

const Sidebar = () => {
  const location = useLocation();

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: '📊' },
    { name: 'Yediklerim', path: '/meals', icon: '🥗' },
    { name: 'Besin Tara', path: '/scan', icon: '📸' },
    { name: 'AI Diyetisyen', path: '/chat', icon: '💬' },
    { name: 'Profil', path: '/profile', icon: '👤' },
  ];

  return (
    <div className="hidden lg:flex w-64 h-screen bg-white border-r border-gray-100 flex-col fixed left-0 top-0 z-30 dark:bg-gray-900 dark:border-gray-800">
      {/* Logo Alanı */}
      <div className="p-8 flex items-center gap-3 justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center text-xl">🐧</div>
          <h1 className="text-xl font-bold text-gray-800 tracking-tight dark:text-white">Diyet<span className="text-[#6FCF97]">AI</span></h1>
        </div>
        <ThemeToggle />
      </div>

      {/* Menü Linkleri */}
      <nav className="flex-1 px-4 space-y-2 mt-4">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 group ${
                isActive 
                  ? 'bg-[#6FCF97] text-white shadow-lg shadow-green-200' 
                  : 'text-gray-500 hover:bg-green-50 hover:text-[#6FCF97] dark:text-gray-300 dark:hover:bg-gray-800'
              }`}
            >
              <span className={`text-xl ${isActive ? 'text-white' : 'grayscale group-hover:grayscale-0'}`}>{item.icon}</span>
              <span className="font-semibold text-sm">{item.name}</span>
              {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white/50" />}
            </Link>
          );
        })}
      </nav>

      {/* Alt Bilgi */}
      <div className="p-6">
        <div className="bg-[#F7FBF9] rounded-2xl p-4 border border-[#E8F5E9] dark:bg-gray-800 dark:border-gray-700">
           <p className="text-xs text-gray-400 font-medium text-center dark:text-gray-300">v1.0.0 Beta</p>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;