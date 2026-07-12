import React from 'react'
import { useTranslation } from 'react-i18next'
import { assets } from '../assets/assets'

const OurPolicy = () => {
  const { t } = useTranslation();
  return (
    <div className='flex flex-col sm:flex-row justify-around gap-12 sm:gap-2 text-center py-20 text-xs sm:text-sm md:text-base text-gray-700'>
      
      <div>
        <img src={assets.exchange_icon} className='w-12 m-auto mb-5' alt="" />
        <p className='font-semibold'>{t('policy_easy_exchange')}</p>
        <p className='text-gray-400'>{t('policy_easy_exchange_description')}</p>
      </div>

      <div>
        <img src={assets.quality_icon} className='w-12 m-auto mb-5' alt="" />
        <p className='font-semibold'>{t('policy_return_policy')}</p>
        <p className='text-gray-400'>{t('policy_return_policy_description')}</p>
      </div>

      <div>
        <img src={assets.support_img} className='w-12 m-auto mb-5' alt="" />
        <p className='font-semibold'>{t('policy_customer_support')}</p>
        <p className='text-gray-400'>{t('policy_customer_support_description')}</p>
      </div>

    </div>
  )
}

export default OurPolicy
