import React from 'react'
import { useTranslation } from 'react-i18next'
import Title from '../components/Title'
import { assets } from '../assets/assets'
import NewsletterBox from '../components/NewsletterBox'

const Contact = () => {
  const { t } = useTranslation();
  return (
    <div>
      <div className='text-center text-2xl pt-10 border-t'>
        <Title text1={t('contact')} text2={t('us')} />
      </div>
      <div className='my-10 flex flex-col justify-center md:flex-row gap-10 mb-28'>
        <img className='w-full md:max-w-[480px]' src={assets.contact_img} alt="" />
        <div className='flex flex-col justify-center items-start gap-6'>
          <p className='font-semibold text-xl text-gray-600'>{t('contact_store')}</p>
          <p className='text-gray-500'>{t('contact_address')}</p>
          <p className='text-gray-500'>{t('contact_tel')}</p>
          <p className='font-semibold text-xl text-gray-600'>{t('contact_careers')}</p>
          <p className='text-gray-500'>{t('contact_careers_description')}</p>
          <button className='border border-black px-8 py-4 text-sm hover:bg-black hover:text-white transition-all duration-500'>{t('contact_explore_jobs')}</button>
        </div>
      </div>

      <NewsletterBox />
    </div>
  )
}

export default Contact