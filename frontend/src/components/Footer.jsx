import React from 'react'
import { useTranslation } from 'react-i18next'
import { assets } from '../assets/assets'

const Footer = () => {
  const { t } = useTranslation();
  return (
    <div>
      <div className='flex flex-col sm:grid grid-cols-[3fr_1fr_1fr] gap-14 my-10 mt-40 text-sm'>
        <div>
          <img src={assets.logo} className='mb-5 w-32' alt="" />
          <p className='w-full md:w-2/3 text-gray-600'>{t('latest_collections_description')}</p>
        </div>

        <div>
          <p className='text-xl font-medium mb-5'>{t('footer_company')}</p>
          <ul className='flex flex-col gap-1 text-gray-600'>
            <li>{t('footer_home')}</li>
            <li>{t('footer_about_us')}</li>
            <li>{t('footer_delivery')}</li>
            <li>{t('footer_privacy_policy')}</li>
          </ul>
        </div>

        <div>
          <p className='text-xl font-medium mb-5'>{t('footer_get_in_touch')}</p>
          <ul className='flex flex-col gap-1 text-gray-600'>
            <li>+84-973-756-727</li>
            <li>admin@AmiVibe.com</li>
          </ul>
        </div>
        
      </div>

    <div>
        <hr />
        <p className='py-5 text-sm text-center'>{t('footer_copyright')}</p>
    </div>

    </div>
  )
}

export default Footer