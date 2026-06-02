import React from 'react'
import Navbar from './components/Navbar'
import Sidebar from './components/Sidebar'
import { Routes, Route, Navigate } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import User from './pages/User'
import Add from './pages/Add'
import List from './pages/List'
import Orders from './pages/Orders'
import Inventory from './pages/Inventory'
import ChatManager from './pages/ChatManager'
import { useState } from 'react'
import Login from './components/Login'
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useEffect } from 'react';




export const backendUrl = import.meta.env.VITE_BACKEND_URL;
export const currency = '$';

const App = () => {

  const [token, setToken] = useState(localStorage.getItem('token')?localStorage.getItem('token'):'');

  useEffect(() => {
    localStorage.setItem('token', token);
  }, [token]);

  return (
    <div className='bg-gray-50 min-h-screen'>
      <ToastContainer />
    {token === ""
    ? <Login setToken={setToken} />
    : (
      <>
        <Navbar setToken={setToken} />
        <hr />
        <div className='flex w-full'>
          <Sidebar />
          <div className='flex-1 min-w-0 w-full px-[max(5vw,25px)] py-8 text-gray-600 text-base h-[calc(100vh-70px)] overflow-y-auto'>
            <Routes>
              <Route path='/' element={<Navigate to="/dashboard" replace />} />
              <Route path='/dashboard' element={<Dashboard token={token} />} />
              <Route path='/user' element={<User token={token} />} />
              <Route path='/add' element={<Add token={token} />} />
              <Route path='/list' element={<List token={token} />} />
              <Route path='/inventory' element={<Inventory token={token} />} />
              <Route path='/orders' element={<Orders token={token} />} />
              <Route path='/manage-chat' element={<ChatManager token={token} />} />
            </Routes>
          </div>
        </div>
      </>
    )}
    </div>
  )
}

export default App  
