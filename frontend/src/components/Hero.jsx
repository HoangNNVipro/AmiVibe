import React from 'react'
import { useTranslation } from 'react-i18next'
import { assets } from '../assets/assets'

const Hero = () => {
  const { t } = useTranslation();
  return (
    <div className='flex flex-col sm:flex-row border border-gray-400'>
      {/* Hero Left Side */}
      <div className='w-full sm:w-1/2 flex items-center justify-center py-10 sm:py-0'>
        <div className='text-[#414141]'>
          <div className='flex items-center gap-2'>
            <p className='w-8 md:w-11 h-[2px] bg-[#414141]'></p>
            <p className='font-medium text-sm md:text-base'>{t('hero_our_bestsellers')}</p>
          </div>
          <h1 className='prata-regular text-3xl sm:py-3 lg:text-5xl leading-relaxed'>{t('hero_latest_arrivals')}</h1>
          <div className='flex items-center gap-2'>
            <p className='font-semibold text-sm md:text-base'>{t('hero_shop_now')}</p>
            <p className='w-8 md:w-11 h-[1px] bg-[#414141]'></p>
          </div>
        </div>
      </div>
      {/* Hero Right */}
      <img className='w-full sm:w-1/2' src={assets.hero_img} alt="" />
    </div>
  )
}

export default Hero