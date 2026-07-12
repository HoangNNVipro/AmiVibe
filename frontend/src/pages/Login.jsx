import React from 'react'
import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import { ShopContext } from '../context/ShopContext'
import { useContext } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { useEffect } from 'react'

const Login = () => {

  const [currentState, setCurrentState] = useState('Login');
  const { token, setToken, backendUrl, navigate } = useContext(ShopContext);
  const { t } = useTranslation();

  const[name, setName] = useState('');
  const[email, setEmail] = useState('');
  const[password, setPassword] = useState('');

  const onSubmitHandler = async (event) => {
    event.preventDefault();
    try {
      if (currentState === 'Sign up') {

        const response = await axios.post(backendUrl + '/api/user/register', { name, email, password });
        if (response.data.success) {
          setToken(response.data.token);
          localStorage.setItem('token', response.data.token);
        } else {
          toast.error(response.data.message);
        }

      } else {

        const response = await axios.post(backendUrl + '/api/user/login', { email, password });
        if (response.data.success) {
          setToken(response.data.token);
          localStorage.setItem('token', response.data.token);
        } else {
          toast.error(response.data.message);
        }
           
      }  
    }
    catch (error) {
      console.log(error);
      const errorMessage = error.response?.data?.message || error.message;
      toast.error(error.message);
    }
  }

  useEffect(() => {
    if (token) {
      navigate('/');
    }
  }, [token]);

  return (
    <form onSubmit={onSubmitHandler} className='flex flex-col items-center w-[90%] sm:max-w-96 m-auto mt-14 gap-4 text-gray-800'>
      <div className='inline-flex items-center gap-2 mb-2 mt-10'>
        <p className='prata-regular text-3xl'>{currentState === 'Login' ? t('login_title') : t('login_sign_up')}</p>
        <hr className='border-none h-[1.5px] w-8 bg-gray-800' />
      </div>
      {currentState === 'Login' ? '' : <input onChange={(e) => setName(e.target.value)} value={name} type="text" className='w-full px-3 py-2 border border-gray-800' placeholder={t('login_name_placeholder')} required/>}
      <input onChange={(e) => setEmail(e.target.value)} value={email} type="email" className='w-full px-3 py-2 border border-gray-800' placeholder={t('login_email_placeholder')} required/>
      <input onChange={(e) => setPassword(e.target.value)} value={password} type="password" className='w-full px-3 py-2 border border-gray-800' placeholder={t('login_password_placeholder')} required/>
      <div className='w-full flex justify-between text-sm mt-[-8px]'>
        <p className='cursor-pointer'>{t('login_forgot_password')}</p>
        {currentState === 'Login' ? (
          <p onClick={() => setCurrentState('Sign up')} className='cursor-pointer'>{t('login_create_account')}</p>
        ) : (
          <p onClick={() => setCurrentState('Login')} className='cursor-pointer'>{t('login_here')}</p>
        )}
      </div>
      <button className='bg-black text-white font-light px-8 py-2 mt-4'>{currentState === 'Login' ? t('login_sign_in') : t('login_sign_up')}</button>
    </form>
  )
}

export default Login