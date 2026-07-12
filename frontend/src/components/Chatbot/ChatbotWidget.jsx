import React, { useContext, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { io } from 'socket.io-client'
import axios from 'axios'
import { toast } from 'react-toastify'
import { ShopContext } from '../../context/ShopContext'
import data from '@emoji-mart/data'
import Picker from '@emoji-mart/react'

// Chế độ thử nghiệm giao diện độc lập không cần backend (Đặt false khi chạy thật)
const USE_MOCK = false;

const UserAvatar = ({ name, isAdminAvatar = false }) => {
  const initials = name
    ? name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
    : 'AD';

  return (
    <div className={`flex items-center justify-center w-10 h-10 rounded-full text-white font-bold text-sm shadow-sm shrink-0 ${
      isAdminAvatar 
        ? 'bg-gradient-to-br from-blue-700 to-indigo-900' 
        : 'bg-gradient-to-br from-emerald-500 to-teal-600'
    }`}>
      {initials}
    </div>
  );
};

const ChatbotWidget = () => {
  const { token, backendUrl } = useContext(ShopContext)
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [inputValue, setInputValue] = useState('')
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [historyLoaded, setHistoryLoaded] = useState(false)
  const [socketStatus, setSocketStatus] = useState('idle')
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  
  const socketRef = useRef(null)
  const scrollRef = useRef(null)
  const pickerRef = useRef(null)

  const toggleOpen = () => {
    if (!token && !USE_MOCK) {
      toast.info('Vui lòng đăng nhập')
      return
    }
    setOpen(prev => !prev)
  }

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }, 50)
  }

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const triggerAutoGreeting = () => {
    const greetingMessage = {
      _id: `welcome-${Date.now()}`,
      from: 'admin',
      text: t('chat_welcome_message'),
      createdAt: new Date().toISOString()
    };
    setMessages([greetingMessage]);
  };

  useEffect(() => {
    if (!open) return
    if (!USE_MOCK && (!token || !backendUrl)) return

    let isMounted = true
    setLoadingHistory(true)
    setHistoryLoaded(false)

    if (USE_MOCK) {
      setTimeout(() => {
        if (!isMounted) return
        triggerAutoGreeting();
        setHistoryLoaded(true)
        setLoadingHistory(false)
      }, 600)
      return
    }

    axios.get(`${backendUrl}/api/chat/history`, { headers: { token } })
      .then(response => {
        if (!isMounted) return
        const payload = response.data?.history ?? response.data?.messages ?? []
        const normalized = Array.isArray(payload)
          ? payload.map((message, index) => ({
              ...message,
              _id: message._id || `${message.from || 'admin'}-${index}`,
              from: message.from || message.sender || 'admin',
              text: message.text || message.message || '',
              createdAt: message.createdAt || message.created_at || new Date().toISOString()
            }))
          : []

        if (normalized.length === 0) {
          triggerAutoGreeting();
        } else {
          setMessages(normalized)
        }
        setHistoryLoaded(true)
      })
      .catch(error => {
        if (error.response?.status === 404) {
          triggerAutoGreeting();
          setHistoryLoaded(true)
          return
        }
        toast.error(t('chat_history_error'))
      })
      .finally(() => {
        if (isMounted) setLoadingHistory(false)
      })

    return () => { isMounted = false }
  }, [open, token, backendUrl])

  useEffect(() => {
    if (!open || !historyLoaded) return
    if (USE_MOCK) {
      setSocketStatus('connected')
      return
    }
    if (!token || !backendUrl) return

    const socket = io(backendUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
      reconnection: true
    })

    socketRef.current = socket
    setSocketStatus('connecting')

    socket.on('connect', () => {
      setSocketStatus('connected')
    })

    socket.on('connect_error', () => setSocketStatus('failed'))
    socket.on('disconnect', () => setSocketStatus('idle'))

    socket.on('receiveMessage', message => {
      const chatMessage = {
        _id: message?.message?._id || message?._id || `admin-${Date.now()}`,
        from: message?.message?.sender || message?.from || message?.sender || 'admin',
        text: message?.message?.text || message?.text || message?.message || message,
        createdAt: message?.message?.timestamp || message?.createdAt || new Date().toISOString()
      }
      setMessages(prev => [...prev, chatMessage])
    })

    return () => {
      socket.disconnect()
      socketRef.current = null
      setSocketStatus('idle')
    }
  }, [open, token, backendUrl, historyLoaded])

  useEffect(() => {
    if (open) scrollToBottom()
  }, [messages, open])

  const handleSendMessage = () => {
    const trimmed = inputValue.trim()
    if (!trimmed) return
    if (!token && !USE_MOCK) {
      toast.info('Vui lòng đăng nhập')
      return
    }

    const newMessage = {
      _id: `user-${Date.now()}`,
      from: 'user',
      text: trimmed,
      createdAt: new Date().toISOString()
    }

    // setMessages(prev => [...prev, newMessage])
    setInputValue('')
    setShowEmojiPicker(false)

    if (USE_MOCK) {
      setTimeout(() => {
        setMessages(prev => [...prev, {
          _id: `mock-admin-${Date.now()}`,
          from: 'admin',
          text: t('chat_mock_admin_message', { message: trimmed }),
          createdAt: new Date().toISOString()
        }]);
      }, 1200);
      return;
    }

    socketRef.current?.emit('sendMessage', { text: trimmed })
  }

  const handleKeyDown = event => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      handleSendMessage()
    }
  }

  const handleSelectEmoji = (emojiObject) => {
    setInputValue(prev => prev + emojiObject.native);
  };

  return (
    <>
      <style>{`
        @keyframes custom-shake {
          0%, 100% { transform: rotate(0deg); }
          5% { transform: rotate(-10deg) scale(1.05); }
          10% { transform: rotate(12deg) scale(1.05); }
          15% { transform: rotate(-10deg); }
          20% { transform: rotate(8deg); }
          25% { transform: rotate(-4deg); }
          30% { transform: rotate(0deg); }
        }
        .chat-btn-pulse { animation: chat-pulse 2s infinite; }
        @keyframes chat-pulse {
          0% { box-shadow: 0 0 0 0 rgba(67, 100, 247, 0.5); }
          70% { box-shadow: 0 0 0 15px rgba(67, 100, 247, 0); }
          100% { box-shadow: 0 0 0 0 rgba(67, 100, 247, 0); }
        }
        .em-picker {
          border-radius: 1rem !important;
          border: 1px solid #e2e8f0 !important;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1) !important;
        }
      `}</style>

      <div className='fixed bottom-6 right-6 z-50 flex flex-col items-end font-sans text-slate-800'>
        {open && (
          <div className='mb-4 w-[360px] max-w-[calc(100vw-32px)] h-[500px] flex flex-col rounded-2xl border border-slate-100 bg-[#F4F7F9] shadow-2xl shadow-slate-900/20'>
            
            <div className='flex items-center justify-between rounded-t-2xl bg-gradient-to-r from-[#0052D4] via-[#4364F7] to-[#6FB1FC] px-4 py-3 text-white shadow-md'>
              <div className='flex items-center gap-3'>
                <UserAvatar name="Admin" isAdminAvatar={true} />
                <div>
                  <div className='text-sm font-bold tracking-wide flex items-center gap-1.5'>
                    {t('chat_support_center')}
                    <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-ping"></span>
                  </div>
                  <div className='text-xs text-blue-100 font-medium'>{t('chat_online_status')}</div>
                </div>
              </div>
              <button
                type='button'
                onClick={() => setOpen(false)}
                className='rounded-full bg-white/20 p-1.5 text-xs font-semibold text-white transition hover:bg-white/30'
              >
                ✕
              </button>
            </div>

            <div className='flex-1 overflow-y-auto px-4 py-4 space-y-3.5 scrollbar-thin'>
              {loadingHistory && (
                <div className='flex justify-center items-center py-8'>
                  <div className='animate-spin rounded-full h-5 w-5 border-2 border-b-transparent border-[#4364F7]'></div>
                </div>
              )}
              
              {!loadingHistory && messages.map((message) => {
                const isUser = message.from === 'user';
                return (
                  <div key={message._id} className={`flex items-start gap-2 max-w-[85%] ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}>
                    {!isUser && <UserAvatar name="Admin" isAdminAvatar={true} />}
                    <div className='flex flex-col'>
                      <div className={`rounded-2xl px-3.5 py-2.5 shadow-sm text-sm break-words leading-relaxed ${
                        isUser 
                          ? 'bg-gradient-to-r from-[#0052D4] to-[#4364F7] text-white rounded-tr-none' 
                          : 'bg-white text-slate-800 rounded-tl-none border border-slate-100'
                      }`}>
                        {message.text}
                      </div>
                      <span className={`text-[10px] text-slate-400 mt-1 px-1 ${isUser ? 'text-right' : 'text-left'}`}>
                        {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                );
              })}
              <div ref={scrollRef} />
            </div>

            <div ref={pickerRef} className='border-t border-slate-100 bg-white px-3 py-3 rounded-b-2xl relative'>
              
              {showEmojiPicker && (
                <div className="absolute bottom-full left-2 mb-2 z-50 max-w-[340px]">
                  <Picker 
                    data={data} 
                    onEmojiSelect={handleSelectEmoji}
                    theme="light"
                    locale="vi"
                    previewPosition="none"
                    skinPosition="none"
                    navPosition="bottom"
                    perLine={8}
                    maxFrequentRows={1}
                  />
                </div>
              )}

              <div className='flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 focus-within:border-[#4364F7] focus-within:bg-white transition-all duration-200'>
                
                <button
                  type='button'
                  onClick={() => setShowEmojiPicker(prev => !prev)}
                  className={`p-1 text-slate-400/60 hover:text-[#4364F7] transition duration-200 hover:scale-105 active:scale-95 ${showEmojiPicker ? 'text-[#4364F7]' : ''}`}
                  title={t('chat_insert_emoji')}
                >
                  <svg 
                    viewBox="0 0 24 24" 
                    className="w-5 h-5 stroke-[1.8] stroke-current fill-none"
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                    <line x1="9" y1="9" x2="9.01" y2="9" className="stroke-[2.5]" />
                    <line x1="15" y1="9" x2="15.01" y2="9" className="stroke-[2.5]" />
                  </svg>
                </button>

                <textarea
                  value={inputValue}
                  onChange={event => setInputValue(event.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={t('chat_input_placeholder')}
                  rows={1}
                  className='flex-1 max-h-[60px] resize-none bg-transparent text-sm outline-none py-1 text-slate-800 placeholder-slate-400 border-none focus:ring-0'
                />

                <button
                  type='button'
                  onClick={handleSendMessage}
                  className='inline-flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-r from-[#0052D4] via-[#4364F7] to-[#6FB1FC] text-white shadow-sm transition-all duration-200 hover:opacity-95 hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:scale-100 disabled:shadow-none'
                  disabled={!inputValue.trim()}
                  title={t('chat_send_message')}
                >
                  <svg 
                    viewBox="0 0 24 24" 
                    className="w-4 h-4 fill-current transform translate-x-[-0.5px] translate-y-[0.5px]"
                  >
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                  </svg>
                </button>

              </div>
            </div>
          </div>
        )}

        <button
          type='button'
          onClick={toggleOpen}
          style={{ animationIterationCount: 'infinite', animationName: 'custom-shake', animationDuration: '0.8s', animationDelay: '5s' }}
          className='chat-btn-pulse flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-[#0052D4] via-[#4364F7] to-[#6FB1FC] text-white shadow-xl transition-all duration-300 hover:scale-110 active:scale-95'
        >
          {open ? <span className='text-xl font-bold'>✕</span> : <span className='text-2xl'>💬</span>}
        </button>
      </div>
    </>
  )
}

export default ChatbotWidget