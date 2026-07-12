import React, { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { assets } from '../assets/assets'

const Sidebar = () => {
  const { t } = useTranslation()
  // State quản lý việc hiển thị màn hình loading overlay
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Dynamically inject Google Font to ensure perfect, unified typography across all browsers
  useEffect(() => {
    if (!document.getElementById('plus-jakarta-sans-sidebar')) {
      const link = document.createElement('link');
      link.id = 'plus-jakarta-sans-sidebar';
      link.href = 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap';
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
  }, []);

  // Hàm xử lý khi bấm nút AI Virtual Try-On
  const handleAITryOnClick = () => {
    setIsRedirecting(true); // Bật overlay loading
    setTimeout(() => {
      // Chuyển hướng sau 1s (1000ms)
      window.location.href = import.meta.env.VITE_AI_VIRTUAL_TRY_ON_URL;
    }, 1000);
  };

  return (
    <>
      {/* KHỐI OVERLAY LOADING TOÀN MÀN HÌNH */}
      {isRedirecting && (
        <div className="fixed inset-0 z-[999] flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm transition-all duration-300">
          <svg className="animate-spin h-12 w-12 text-pink-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-xl font-semibold text-slate-700 tracking-wide font-['Plus_Jakarta_Sans',sans-serif]">
            {t('sidebar_redirecting_to_ai_virtual_try_on')}
          </p>
        </div>
      )}

      {/* GIAO DIỆN SIDEBAR CHÍNH */}
      <div className="w-[70px] md:w-[16%] min-h-screen border-r border-slate-100 bg-white px-3 pt-8 flex flex-col gap-2 select-none font-['Plus_Jakarta_Sans',sans-serif] antialiased">
        
        {/* 1. Dashboard */}
        <NavLink 
          to="/dashboard"
          className={({ isActive }) => 
            `flex items-center gap-3 px-4 py-3.5 rounded-xl text-[14px] font-medium transition-all duration-200 group cursor-pointer ${
              isActive 
                ? 'bg-pink-500 text-white shadow-md shadow-pink-500/20 font-semibold' 
                : 'text-slate-600 hover:bg-pink-50 hover:text-pink-500'
            }`
          }
        >
          <div className="w-5 h-5 flex items-center justify-center flex-shrink-0 group-[.bg-pink-500]:text-white text-slate-400 group-hover:text-pink-500 transition-colors">
            <svg className="w-5 h-5 stroke-current fill-none" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 3.055A9.003 9.003 0 1020.945 13H11V3.055z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
            </svg>
          </div>
          <p className="hidden md:block tracking-wide">{t('sidebar_dashboard')}</p>
        </NavLink>

        {/* 2. Add Items */}
        <NavLink 
          to="/add"
          className={({ isActive }) => 
            `flex items-center gap-3 px-4 py-3.5 rounded-xl text-[14px] font-medium transition-all duration-200 group cursor-pointer ${
              isActive 
                ? 'bg-pink-500 text-white shadow-md shadow-pink-500/20 font-semibold' 
                : 'text-slate-600 hover:bg-pink-50 hover:text-pink-500'
            }`
          }
        >
          <img 
            className="w-5 h-5 transition-transform duration-200 group-hover:scale-105 select-none opacity-60 group-[.bg-pink-500]:opacity-100 group-[.bg-pink-500]:invert group-[.bg-pink-500]:brightness-200" 
            src={assets.add_icon} 
            alt="Add Items" 
          />
          <p className="hidden md:block tracking-wide">{t('sidebar_add_items')}</p>
        </NavLink>

        {/* 3. List Items */}
        <NavLink 
          to="/list"
          className={({ isActive }) => 
            `flex items-center gap-3 px-4 py-3.5 rounded-xl text-[14px] font-medium transition-all duration-200 group cursor-pointer ${
              isActive 
                ? 'bg-pink-500 text-white shadow-md shadow-pink-500/20 font-semibold' 
                : 'text-slate-600 hover:bg-pink-50 hover:text-pink-500'
            }`
          }
        >
          <div className="w-5 h-5 flex items-center justify-center flex-shrink-0 group-[.bg-pink-500]:text-white text-slate-400 group-hover:text-pink-500 transition-colors">
            <svg className="w-5 h-5 stroke-current fill-none" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
          </div>
          <p className="hidden md:block tracking-wide">{t('sidebar_list_items')}</p>
        </NavLink>

        {/* 4. Inventory */}
        <NavLink 
          to="/inventory"
          className={({ isActive }) => 
            `flex items-center gap-3 px-4 py-3.5 rounded-xl text-[14px] font-medium transition-all duration-200 group cursor-pointer ${
              isActive 
                ? 'bg-pink-500 text-white shadow-md shadow-pink-500/20 font-semibold' 
                : 'text-slate-600 hover:bg-pink-50 hover:text-pink-500'
            }`
          }
        >
          <div className="w-5 h-5 flex items-center justify-center flex-shrink-0 group-[.bg-pink-500]:text-white text-slate-400 group-hover:text-pink-500 transition-colors">
            <svg className="w-5 h-5 stroke-current fill-none" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
            </svg>
          </div>
          <p className="hidden md:block tracking-wide">{t('sidebar_inventory')}</p>
        </NavLink>

        {/* 5. Orders */}
        <NavLink 
          to="/orders"
          className={({ isActive }) => 
            `flex items-center gap-3 px-4 py-3.5 rounded-xl text-[14px] font-medium transition-all duration-200 group cursor-pointer ${
              isActive 
                ? 'bg-pink-500 text-white shadow-md shadow-pink-500/20 font-semibold' 
                : 'text-slate-600 hover:bg-pink-50 hover:text-pink-500'
            }`
          }
        >
          <div className="w-5 h-5 flex items-center justify-center flex-shrink-0 group-[.bg-pink-500]:text-white text-slate-400 group-hover:text-pink-500 transition-colors">
            <svg className="w-5 h-5 stroke-current fill-none" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <p className="hidden md:block tracking-wide">{t('sidebar_orders')}</p>
        </NavLink>

        {/* 6. Manage Chat (Thêm mới kết nối đến route quản trị live chat) */}
        <NavLink 
          to="/manage-chat"
          className={({ isActive }) => 
            `flex items-center gap-3 px-4 py-3.5 rounded-xl text-[14px] font-medium transition-all duration-200 group cursor-pointer ${
              isActive 
                ? 'bg-pink-500 text-white shadow-md shadow-pink-500/20 font-semibold' 
                : 'text-slate-600 hover:bg-pink-50 hover:text-pink-500'
            }`
          }
        >
          <div className="w-5 h-5 flex items-center justify-center flex-shrink-0 group-[.bg-pink-500]:text-white text-slate-400 group-hover:text-pink-500 transition-colors">
            <svg className="w-5 h-5 stroke-current fill-none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <p className="hidden md:block tracking-wide">{t('sidebar_manage_chat')}</p>
        </NavLink>

        {/* 7. Manage Users */}
        <NavLink 
          to="/user"
          className={({ isActive }) => 
            `flex items-center gap-3 px-4 py-3.5 rounded-xl text-[14px] font-medium transition-all duration-200 group cursor-pointer ${
              isActive 
                ? 'bg-pink-500 text-white shadow-md shadow-pink-500/20 font-semibold' 
                : 'text-slate-600 hover:bg-pink-50 hover:text-pink-500'
            }`
          }
        >
          <div className="w-5 h-5 flex items-center justify-center flex-shrink-0 group-[.bg-pink-500]:text-white text-slate-400 group-hover:text-pink-500 transition-colors">
            <svg className="w-5 h-5 stroke-current fill-none" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <p className="hidden md:block tracking-wide">{t('sidebar_manage_users')}</p>
        </NavLink>

        {/* 8. AI Virtual Try-On Button (External link) */}
        <div 
          onClick={handleAITryOnClick}
          className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-[14px] font-medium transition-all duration-200 group cursor-pointer text-slate-600 hover:bg-pink-50 hover:text-pink-500"
        >
          {/* Icon "Sparkles" (Phép thuật/AI) */}
          <div className="w-5 h-5 flex items-center justify-center flex-shrink-0 text-slate-400 group-hover:text-pink-500 transition-colors">
            <svg className="w-5 h-5 stroke-current fill-none" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.428-1.428L13.5 18.75l1.183-.394a2.25 2.25 0 001.428-1.428l.394-1.183.394 1.183a2.25 2.25 0 001.428 1.428l1.183.394-1.183.394a2.25 2.25 0 00-1.428 1.428z" />
            </svg>
          </div>
          <p className="hidden md:block tracking-wide">{t('sidebar_ai_virtual_try_on')}</p>
        </div>

      </div>
    </>
  )
}

export default Sidebar
