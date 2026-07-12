import React, { useState, useContext } from 'react'
import { useTranslation } from 'react-i18next'
import { assets } from '../assets/assets'
import { Link, NavLink } from 'react-router-dom'
import { ShopContext } from '../context/ShopContext'

const Navbar = () => {

  const [visible, setVisible] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);

  const { setShowSearch, getCartCount, token, setToken, navigate, setCartItems } = useContext(ShopContext);
  const { i18n, t } = useTranslation();
  const currentLanguage = i18n.language?.startsWith('vi') ? 'VI' : 'EN';

  const logout = () => {
    navigate('/login');
    localStorage.removeItem('token');
    setToken('');
    setCartItems({});
  }

  return (
    <div className='flex items-center justify-between py-5 font-medium'>
      
      <Link to='/'><img src={assets.logo} className='w-36' alt="" /></Link>
      
      <ul className='hidden sm:flex gap-5 text-sm text-gray-700'>
        
        <NavLink to='/' className='flex flex-col items-center gap-1'>
          <p>{t('home').toUpperCase()}</p>
          <hr className='w-2/4 border-none h-[1.5px] bg-gray-700 hidden' />
        </NavLink>

        <NavLink to='/collection' className='flex flex-col items-center gap-1'>
          <p>{t('collection').toUpperCase()}</p>
          <hr className='w-2/4 border-none h-[1.5px] bg-gray-700 hidden' />
        </NavLink>

        <NavLink to='/about' className='flex flex-col items-center gap-1'>
          <p>{t('about').toUpperCase()}</p>
          <hr className='w-2/4 border-none h-[1.5px] bg-gray-700 hidden' />
        </NavLink>

        <NavLink to='/contact' className='flex flex-col items-center gap-1'>
          <p>{t('contact').toUpperCase()}</p>
          <hr className='w-2/4 border-none h-[1.5px] bg-gray-700 hidden' />
        </NavLink>
      
      </ul>
      
      <div className='flex items-center gap-6'>
        <div className='relative z-50'>
          <button
            type='button'
            onClick={() => setLanguageOpen((prev) => !prev)}
            className='flex items-center gap-2 rounded-full border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:border-gray-400 hover:text-black'
          >
            <span className='text-base'>🌐</span>
            <span>{currentLanguage}</span>
          </button>

          {languageOpen && (
            <div className='absolute right-0 mt-2 w-40 rounded-xl border border-gray-200 bg-white p-2 shadow-xl z-[60]'>
              <button
                type='button'
                onClick={() => {
                  i18n.changeLanguage('en');
                  setLanguageOpen(false);
                }}
                className='flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-100'
              >
                <span>English</span>
                <span className='text-xs text-gray-400'>EN</span>
              </button>
              <button
                type='button'
                onClick={() => {
                  i18n.changeLanguage('vi');
                  setLanguageOpen(false);
                }}
                className='flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-100'
              >
                <span>Tiếng Việt</span>
                <span className='text-xs text-gray-400'>VI</span>
              </button>
            </div>
          )}
        </div>

        <img onClick={() => setShowSearch(true)} src={assets.search_icon} className='w-5 cursor-pointer' alt="" />
        
        <div className='group relative'>
          <img onClick={() => token ? null :navigate('/login')} className='w-5 cursor-pointer' src={assets.profile_icon} alt="" />
          {/* Dropdown menu */}
          {token && 
            <div className='group-hover:block hidden absolute dropdown-menu right-0 pt-4 z-50'>
            <div className='flex flex-col gap-2 w-36 py-3 px-5 bg-slate-100 text-gray-500 rounded'>
              <p className='cursor-pointer hover:text-black'>{t('navbar_my_profile')}</p>
              <p onClick={() => navigate('/orders')} className='cursor-pointer hover:text-black'>{t('navbar_orders')}</p>
              <p onClick={logout} className='cursor-pointer hover:text-black'>{t('navbar_logout')}</p>
            </div>
          </div>
          }
          
        </div>

        <Link to='/cart' className='relative'>
          <img src={assets.cart_icon} className='w-5 min-w-5' alt="" />
          <p className='absolute right-[-5px] bottom-[-5px] w-4 text-center leading-4 bg-black text-white aspect-square rounded-full text-[8px]'>{getCartCount()}</p>
        </Link>

        <img onClick={() => setVisible(true)} src={assets.menu_icon} className='w-5 cursor-pointer sm:hidden' alt="" />
      </div>

      {/* Sidebar menu for small screens */}
      <div className={`absolute top-0 right-0 bottom-0 overflow-hidden bg-white transition-all ${visible ? 'w-full' : 'w-0'}`}>
        <div className='flex flex-col text-gray-600'>
          <div onClick={() => setVisible(false)} className='flex items-center gap-4 p-3 cursor-pointer'>
            <img className='h-4 rotate-180' src={assets.dropdown_icon} alt="" />
            <p>{t('navbar_back')}</p>
          </div>
          <NavLink onClick={() => setVisible(false)} to='/' className='py-2 pl-6 border'>{t('home').toUpperCase()}</NavLink>
          <NavLink onClick={() => setVisible(false)} to='/collection' className='py-2 pl-6 border'>{t('collection').toUpperCase()}</NavLink>
          <NavLink onClick={() => setVisible(false)} to='/about' className='py-2 pl-6 border'>{t('about').toUpperCase()}</NavLink>
          <NavLink onClick={() => setVisible(false)} to='/contact' className='py-2 pl-6 border'>{t('contact').toUpperCase()}</NavLink>
        </div>
      </div>
    </div>
  )
}

export default Navbar