import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { assets } from '../assets/assets'

const Navbar = ({ setToken }) => {
  const { t, i18n } = useTranslation()
  const [isLanguageOpen, setIsLanguageOpen] = useState(false)

  const currentLanguage = i18n.language?.startsWith('vi') ? 'VI' : 'EN'

  const handleLanguageChange = (lang) => {
    i18n.changeLanguage(lang)
    setIsLanguageOpen(false)
  }

  return (
    <div className='flex items-center py-2 px-[4%] justify-between'>
      <img className='w-[max(10%, 80px)]' src={assets.logo_admin_panel} alt='' />

      <div className='flex items-center gap-3 relative'>
        <div className='relative z-[1000]'>
          <button
            type='button'
            onClick={() => setIsLanguageOpen((prev) => !prev)}
            className='flex items-center gap-2 rounded-full border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-sm transition hover:border-slate-400 hover:bg-slate-50 sm:px-4 sm:text-sm'
          >
            <span>🌐</span>
            <span>{currentLanguage}</span>
          </button>

          {isLanguageOpen && (
            <div className='absolute right-0 mt-2 w-44 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl'>
              <button
                type='button'
                onClick={() => handleLanguageChange('en')}
                className={`flex w-full items-center justify-between px-4 py-3 text-left text-sm transition ${i18n.language?.startsWith('en') ? 'bg-slate-100 font-semibold text-slate-900' : 'text-slate-700 hover:bg-slate-50'}`}
              >
                <span>English</span>
                <span className='text-xs'>EN</span>
              </button>
              <button
                type='button'
                onClick={() => handleLanguageChange('vi')}
                className={`flex w-full items-center justify-between px-4 py-3 text-left text-sm transition ${i18n.language?.startsWith('vi') ? 'bg-slate-100 font-semibold text-slate-900' : 'text-slate-700 hover:bg-slate-50'}`}
              >
                <span>Tiếng Việt</span>
                <span className='text-xs'>VI</span>
              </button>
            </div>
          )}
        </div>

        <button
          onClick={() => setToken('')}
          className='rounded-full bg-gray-600 px-5 py-2 text-xs font-medium text-white transition hover:bg-gray-700 sm:px-7 sm:py-2 sm:text-sm'
        >
          {t('navbar_logout')}
        </button>
      </div>
    </div>
  )
}

export default Navbar