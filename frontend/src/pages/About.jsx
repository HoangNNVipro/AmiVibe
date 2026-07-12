import React from 'react'
import { useTranslation } from 'react-i18next'
import Title from '../components/Title'
import { assets } from '../assets/assets'
import NewsletterBox from '../components/NewsletterBox'

const About = () => {
  const { t } = useTranslation();
  return (
    <div>
      <div className='text-2xl text-center pt-8 border-t'>
        <Title text1={t('about')} text2={t('us')}/>
      </div>
      <div className='my-10 flex flex-col md:flex-row gap-16'>
        <img className='w-full md:max-w-[450px]' src={assets.about_img} alt="" />
        <div className='flex flex-col justify-center gap-6 md:w-2/4 text-gray-600'>
          <p>{t('about_intro_1')}</p>
          <p>{t('about_intro_2')}</p>
          <b className='text-gray-800'>{t('about_mission_title')}</b>
          <p>{t('about_mission_text')}</p>
        </div>
      </div>
      <div className='text-xl py-4'>
        <Title text1={t('why')} text2={t('about_why_choose_us')} />
      </div>
      
      <div className='flex flex-row text-sm mb-20 gap-4'>
        <div className='border px-10 md:px-16 py-8 sm:py-20 flex flex-col gap-5 flex-1'>
          <b>{t('about_quality_assurance')}</b>
          <p className='text-gray-600'>{t('about_quality_assurance_text')}</p>
        </div>
        <div className='border px-10 md:px-16 py-8 sm:py-20 flex flex-col gap-5 flex-1'>
          <b>{t('about_convenience')}</b>
          <p className='text-gray-600'>{t('about_convenience_text')}</p>
        </div>
        <div className='border px-10 md:px-16 py-8 sm:py-20 flex flex-col gap-5 flex-1'>
          <b>{t('about_customer_service')}</b>
          <p className='text-gray-600'>{t('about_customer_service_text')}</p>
        </div>
      </div>

      <NewsletterBox />

    </div>
  )
}

export default About