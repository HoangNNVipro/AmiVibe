import React, { useState, useEffect, useRef, useMemo } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';
import { toast } from 'react-toastify';
import { backendUrl } from '../App';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';

// Đặt thành false để kết nối trực tiếp với Database & Socket thật của bạn
const USE_MOCK = false;

// Dữ liệu giả lập phong phú bằng tiếng Anh để test giao diện trực quan
const INITIAL_MOCK_CHATS = [
  { 
    userId: 'user_01', 
    name: 'Alex Johnson', 
    status: 'waiting_for_admin', 
    lastMessage: 'Hi! Is the premium leather jacket in size L still available?', 
    time: new Date(Date.now() - 5 * 60000).toISOString(),
    messages: [
      { sender: 'user', text: 'Hello support team!', timestamp: new Date(Date.now() - 30 * 60000).toISOString() },
      { sender: 'admin', text: 'Hello! How can I assist you with our collection today?', timestamp: new Date(Date.now() - 25 * 60000).toISOString() },
      { sender: 'user', text: 'Hi! Is the premium leather jacket in size L still available?', timestamp: new Date(Date.now() - 5 * 60000).toISOString() },
    ]
  },
  { 
    userId: 'user_02', 
    name: 'Sarah Smith', 
    status: 'waiting_for_admin', 
    lastMessage: 'Can I change my shipping address for order #4019?', 
    time: new Date(Date.now() - 12 * 60000).toISOString(),
    messages: [
      { sender: 'user', text: 'Can I change my shipping address for order #4019?', timestamp: new Date(Date.now() - 12 * 60000).toISOString() }
    ]
  },
  { 
    userId: 'user_03', 
    name: 'David Miller', 
    status: 'in_progress', 
    lastMessage: 'Great, I will complete the checkout now. Thank you!', 
    time: new Date(Date.now() - 45 * 60000).toISOString(),
    messages: [
      { sender: 'user', text: 'Do you offer international shipping to the UK?', timestamp: new Date(Date.now() - 60 * 60000).toISOString() },
      { sender: 'admin', text: 'Yes, we ship worldwide! Shipping to the UK takes about 5-7 business days.', timestamp: new Date(Date.now() - 55 * 60000).toISOString() },
      { sender: 'user', text: 'Great, I will complete the checkout now. Thank you!', timestamp: new Date(Date.now() - 45 * 60000).toISOString() }
    ]
  },
  { 
    userId: 'user_04', 
    name: 'Emily Davis', 
    status: 'resolved', 
    lastMessage: 'Got the dress! It fits perfectly. Thank you so much!', 
    time: new Date(Date.now() - 120 * 60000).toISOString(),
    messages: [
      { sender: 'user', text: 'Is the color exactly the same as shown in the picture?', timestamp: new Date(Date.now() - 150 * 60000).toISOString() },
      { sender: 'admin', text: 'Yes, it is 100% matched. We take our photos in natural studio light.', timestamp: new Date(Date.now() - 140 * 60000).toISOString() },
      { sender: 'user', text: 'Got the dress! It fits perfectly. Thank you so much!', timestamp: new Date(Date.now() - 120 * 60000).toISOString() }
    ]
  }
];

// REACT COMPONENT WRAPPER ĐỂ SỬ DỤNG TRỰC TIẾP EMOJI-MART CDN AN TOÀN TRÁNH LỖI COMPILE
const EmojiPickerCDN = ({ onEmojiSelect }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    // Tải động script chính thống của Emoji Mart nếu chưa có trong DOM
    if (!document.getElementById('emoji-mart-script-cdn')) {
      const script = document.createElement('script');
      script.id = 'emoji-mart-script-cdn';
      script.src = 'https://cdn.jsdelivr.net/npm/emoji-mart@latest/dist/browser.js';
      script.async = true;
      document.head.appendChild(script);
    }

    const handleEmojiSelect = (e) => {
      if (onEmojiSelect && e.detail) {
        onEmojiSelect(e.detail);
      }
    };

    let pickerEl = null;

    const mountPicker = () => {
      if (!containerRef.current) return;
      pickerEl = document.createElement('em-emoji-picker');
      pickerEl.setAttribute('theme', 'light');
      pickerEl.setAttribute('set', 'native');
      pickerEl.setAttribute('locale', 'en');
      
      // Định dạng phông nền popup màu trắng sữa giống hệt Widget phía khách hàng
      pickerEl.style.setProperty('--background', '#ffffff');
      pickerEl.style.setProperty('--background-rgb', '255, 255, 255');
      pickerEl.style.setProperty('--border-radius', '16px');
      pickerEl.style.setProperty('--border-color', '#f1f5f9');
      pickerEl.style.width = '338px';
      pickerEl.style.height = '380px';
      pickerEl.style.boxShadow = 'none';
      pickerEl.style.border = 'none';

      pickerEl.addEventListener('emojiselect', handleEmojiSelect);
      containerRef.current.appendChild(pickerEl);
    };

    const checkAndMount = () => {
      if (window.customElements && window.customElements.get('em-emoji-picker')) {
        mountPicker();
      } else {
        const checkInterval = setInterval(() => {
          if (window.customElements && window.customElements.get('em-emoji-picker')) {
            mountPicker();
            clearInterval(checkInterval);
          }
        }, 100);

        return () => clearInterval(checkInterval);
      }
    };

    const cleanupInterval = checkAndMount();

    return () => {
      if (cleanupInterval) cleanupInterval();
      if (pickerEl) {
        pickerEl.removeEventListener('emojiselect', handleEmojiSelect);
        pickerEl.remove();
      }
    };
  }, [onEmojiSelect]);

  return (
    <div 
      ref={containerRef} 
      className="bg-white rounded-2xl overflow-hidden shadow-2xl border border-slate-100" 
      style={{ width: '338px', height: '380px' }}
    />
  );
};

const UserAvatar = ({ name }) => {
  const initials = name
    ? name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
    : 'CS';

  return (
    <div className="flex items-center justify-center w-10 h-10 rounded-full text-white font-bold text-xs shadow-sm shrink-0 bg-gradient-to-br from-[#0052D4] to-[#4364F7]">
      {initials}
    </div>
  );
};

const ChatManager = ({ token }) => {
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const socketRef = useRef(null);
  const scrollRef = useRef(null);
  const chatContainerRef = useRef(null); // Ref dùng cho việc cuộn tin nhắn mượt mà
  const filterDropdownRef = useRef(null);
  const pickerContainerRef = useRef(null);
  const messageInputRef = useRef(null);

  // Ref quản lý ID của khách hàng đang chat để tự động kết nối lại khi có sự cố
  const activeChatUserIdRef = useRef(null);

  const handleSelectEmoji = (emojiObject) => {
    if (!emojiObject.native) return;
    setInputValue(prev => prev + emojiObject.native);
    // Bỏ dòng setShowEmojiPicker(false); để có thể chọn nhiều emoji cùng lúc
    setTimeout(() => messageInputRef.current?.focus(), 0);
  };

  const scrollToBottom = (isNewChat = false) => {
    setTimeout(() => {
      if (!chatContainerRef.current) return;
      const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
      
      // Kiểm tra xem có đang ở gần đáy chat không (cách đáy khoảng 150px)
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 150;
      
      // Chỉ cuộn nếu đang ở gần đáy HOẶC vừa click mở phòng chat mới
      if (isNewChat || isNearBottom) {
        chatContainerRef.current.scrollTo({ top: scrollHeight, behavior: 'smooth' });
      }
    }, 50);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(e.target)) {
        setIsFilterOpen(false);
      }
      if (pickerContainerRef.current && !pickerContainerRef.current.contains(e.target)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchChats = async () => {
    if (USE_MOCK) {
      setChats(INITIAL_MOCK_CHATS);
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get(`${backendUrl}/api/chat/all-chats`, {
        headers: { token }
      });

      if (response.data.success) {
        setChats(response.data.chats);
      } else {
        toast.error(response.data.message || 'Error loading chat list');
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to connect to chat list API.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChats();
  }, [token]);

  // Thiết lập luồng Socket.io đồng bộ trạng thái thực tế
  useEffect(() => {
    if (USE_MOCK) return;
    if (!token || !backendUrl) return;

    const socket = io(backendUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnection: true
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Admin Chat Socket connected:', socket.id);
      
      if (activeChatUserIdRef.current) {
        socket.emit('joinAdminRoom', { userId: activeChatUserIdRef.current }, (response) => {
          if (response?.success) {
            console.log('Successfully rejoined support session for:', activeChatUserIdRef.current);
          }
        });
      }
    });

    socket.on('adminListUpdate', (data) => {
      setChats((prevChats) => {
        const index = prevChats.findIndex((c) => c.userId === data.userId);
        if (index !== -1) {
          const updated = [...prevChats];
          updated[index] = {
            ...updated[index],
            name: data.name || updated[index].name,
            status: data.status,
            lastMessage: data.lastMessage,
            time: data.time
          };
          return updated;
        } else {
          return [
            {
              userId: data.userId,
              name: data.name || `Customer (${String(data.userId).substring(0, 5)})`,
              status: data.status,
              lastMessage: data.lastMessage,
              time: data.time,
              messages: []
            },
            ...prevChats
          ];
        }
      });

      setActiveChat((prevActive) => {
        if (prevActive && prevActive.userId === data.userId) {
          return { ...prevActive, status: data.status };
        }
        return prevActive;
      });
    });

    socket.on('receiveMessage', (payload) => {
      setChats((prevChats) => {
        return prevChats.map((c) => {
          if (c.userId === payload.userId) {
            const currentMessages = c.messages || [];
            if (payload.message._id && currentMessages.some((m) => m._id === payload.message._id)) return c;
            
            return {
              ...c,
              messages: [...currentMessages, payload.message],
              lastMessage: payload.message.text,
              time: payload.message.timestamp
            };
          }
          return c;
        });
      });

      setActiveChat((prevActive) => {
        if (prevActive && prevActive.userId === payload.userId) {
          const currentMsgs = prevActive.messages || [];
          if (payload.message._id && currentMsgs.some((m) => m._id === payload.message._id)) return prevActive;
          return {
            ...prevActive,
            messages: [...currentMsgs, payload.message]
          };
        }
        return prevActive;
      });
    });

    socket.on('chatStatusUpdated', (data) => {
      setChats((prevChats) =>
        prevChats.map((c) => (c.userId === data.userId ? { ...c, status: data.status } : c))
      );
      setActiveChat((prevActive) =>
        prevActive && prevActive.userId === data.userId ? { ...prevActive, status: data.status } : prevActive
      );
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token]);

  // Tự động cuộn có điều kiện khi có tin nhắn mới
  useEffect(() => {
    if (activeChat) scrollToBottom(false);
  }, [activeChat?.messages]);

  // Luôn cuộn xuống đáy khi chuyển phòng chat
  useEffect(() => {
    if (activeChat) scrollToBottom(true);
  }, [activeChat?.userId]);

  const handleSelectChat = (chat) => {
    setActiveChat(chat);
    activeChatUserIdRef.current = chat.userId;

    if (USE_MOCK) {
      setChats((prev) =>
        prev.map((c) => (c.userId === chat.userId ? { ...c, status: 'in_progress' } : c))
      );
      setActiveChat((prev) => (prev ? { ...prev, status: 'in_progress' } : null));
      return;
    }

    socketRef.current?.emit('joinAdminRoom', { userId: chat.userId }, (response) => {
      if (response?.success) {
        setActiveChat((prev) => ({
          ...prev,
          messages: response.chat?.messages || [],
          status: 'in_progress'
        }));
      } else {
        toast.error(response?.message || 'Could not connect to the chat room');
      }
    });
  };

  const handleSendAdminMessage = (textToSend = '') => {
    const text = textToSend || inputValue.trim();
    if (!text || !activeChat) return;

    // Thêm lệnh tắt popup emoji 
    setShowEmojiPicker(false);

    if (USE_MOCK) {
      const newMsg = {
        sender: 'admin',
        text,
        timestamp: new Date().toISOString()
      };

      setChats((prev) =>
        prev.map((c) => {
          if (c.userId === activeChat.userId) {
            return {
              ...c,
              messages: [...(c.messages || []), newMsg],
              lastMessage: text,
              time: newMsg.timestamp
            };
          }
          return c;
        })
      );

      setActiveChat((prev) => ({
        ...prev,
        messages: [...(prev.messages || []), newMsg]
      }));

      setInputValue('');

      setTimeout(() => {
        const clientMsg = {
          sender: 'user',
          text: 'Thank you for your response! I am submitting my payment now.',
          timestamp: new Date().toISOString()
        };
        setChats((prev) =>
          prev.map((c) => {
            if (c.userId === activeChat.userId) {
              return {
                ...c,
                status: 'waiting_for_admin', 
                messages: [...(c.messages || []), clientMsg],
                lastMessage: clientMsg.text,
                time: clientMsg.timestamp
              };
            }
            return c;
          })
        );
        setActiveChat((prev) => {
          if (prev && prev.userId === activeChat.userId) {
            return {
              ...prev,
              status: 'waiting_for_admin',
              messages: [...(prev.messages || []), clientMsg]
            };
          }
          return prev;
        });
      }, 2500);

      return;
    }

    socketRef.current?.emit('sendMessage', {
      text,
      userId: activeChat.userId,
      sender: 'admin'
    }, (response) => {
      if (response?.success) {
        setInputValue('');
      } else {
        toast.error('Failed to send message.');
      }
    });
  };

  const handleResolveChat = () => {
    if (!activeChat) return;

    if (USE_MOCK) {
      setChats((prev) =>
        prev.map((c) => (c.userId === activeChat.userId ? { ...c, status: 'resolved' } : c))
      );
      setActiveChat(null);
      activeChatUserIdRef.current = null;
      toast.success('Support session resolved.');
      return;
    }

    socketRef.current?.emit('resolveChat', { userId: activeChat.userId }, (response) => {
      if (response?.success) {
        setActiveChat(null);
        activeChatUserIdRef.current = null;
        toast.success('Session resolved successfully.');
      } else {
        toast.error('Failed to resolve support session.');
      }
    });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendAdminMessage();
    }
  };

  const filteredChats = useMemo(() => {
    return chats.filter((chat) => {
      const matchesSearch = chat.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            chat.userId.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'All' || chat.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [chats, searchQuery, statusFilter]);

  const sortedChats = useMemo(() => {
    return [...filteredChats].sort((a, b) => {
      if (a.status === 'waiting_for_admin' && b.status !== 'waiting_for_admin') return -1;
      if (a.status !== 'waiting_for_admin' && b.status === 'waiting_for_admin') return 1;
      return new Date(b.time) - new Date(a.time);
    });
  }, [filteredChats]);

  const metrics = useMemo(() => {
    const total = chats.length;
    const waiting = chats.filter((c) => c.status === 'waiting_for_admin').length;
    const inProgress = chats.filter((c) => c.status === 'in_progress').length;
    const resolved = chats.filter((c) => c.status === 'resolved').length;
    return { total, waiting, inProgress, resolved };
  }, [chats]);

  return (
    <div className="bg-slate-50 pt-0 sm:pt-0.5 pb-2 px-2 sm:pb-4 sm:px-4 select-none font-sans text-slate-700 antialiased h-full">
      <div className="max-w-[1600px] mx-auto h-full">
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[610px] min-h-[500px] items-stretch">
          
          {/* CỘT CHAT CHÍNH BÊN TRÁI (3/4) */}
          <div className="lg:col-span-3 bg-[#F4F7F9] rounded-2xl border border-slate-100 shadow-sm flex flex-col overflow-hidden h-full">
            {activeChat ? (
              <div className="flex flex-col h-full">
                
                {/* Header thanh trò chuyện tông màu Royal Blue Gradient mượt mà */}
                <div className="px-6 py-3.5 bg-gradient-to-r from-[#0052D4] via-[#4364F7] to-[#6FB1FC] text-white flex justify-between items-center shadow-md shrink-0">
                  <div className="flex items-center gap-3">
                    <UserAvatar name={activeChat.name} />
                    <div>
                      <h3 className="font-bold text-white text-sm leading-tight">{activeChat.name}</h3>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          activeChat.status === 'waiting_for_admin' ? 'bg-rose-400 animate-ping' :
                          activeChat.status === 'in_progress' ? 'bg-emerald-400 animate-pulse' : 'bg-slate-300'
                        }`} />
                        <p className="text-[11px] text-blue-100 font-medium">
                          {activeChat.status === 'waiting_for_admin' ? 'Urgent support needed' :
                           activeChat.status === 'in_progress' ? 'Assisting live' : 'Session closed'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={handleResolveChat}
                    className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer border border-white/10 shadow-xs"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Close Support
                  </button>
                </div>
                
                {/* Khung tin nhắn cuộn độc lập - Đã cập nhật ref để xử lý scroll mượt */}
                <div ref={chatContainerRef} className="flex-1 overflow-y-auto px-6 py-5 bg-[#F4F7F9] space-y-4 scrollbar-thin">
                  {activeChat.messages && activeChat.messages.map((msg, index) => {
                    const isAdmin = msg.sender === 'admin';
                    return (
                      <div key={index} className={`flex items-start gap-2 max-w-[85%] ${isAdmin ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}>
                        {!isAdmin && <UserAvatar name={activeChat.name} />}
                        <div className="flex flex-col">
                          <div className={`rounded-2xl px-3.5 py-2.5 shadow-sm text-sm break-words leading-relaxed ${
                            isAdmin 
                              ? 'bg-gradient-to-r from-[#0052D4] to-[#4364F7] text-white rounded-tr-none shadow-md' 
                              : 'bg-white text-slate-800 rounded-tl-none border border-slate-100'
                          }`}>
                            <p className="font-normal">{msg.text}</p>
                          </div>
                          <span className={`text-[10px] text-slate-400 mt-1 px-1 ${isAdmin ? 'text-right' : 'text-left'}`}>
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={scrollRef} />
                </div>
                
                {/* Thanh nhập liệu thiết kế đồng bộ với Frontend của khách */}
                <div ref={pickerContainerRef} className="p-4 bg-white border-t border-slate-100 rounded-b-2xl relative shrink-0">
                  
                  {/* Sử dụng React Component Wrapper nạp CDN chính thống, đảm bảo phông nền màu trắng tinh khôi (#ffffff) */}
                  {showEmojiPicker && (
                    <div className="absolute bottom-full left-4 mb-2.5 z-50 shadow-2xl rounded-2xl bg-white overflow-hidden">
                      <Picker 
                        data={data} 
                        onEmojiSelect={handleSelectEmoji}
                        theme="light"
                        locale="en"
                        previewPosition="none"
                        skinPosition="none"
                      />
                    </div>
                  )}

                  {/* Wrapper nhập tin nhắn phong cách cao cấp */}
                  <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 focus-within:border-[#4364F7] focus-within:bg-white transition-all duration-200">
                    
                    {/* Nút bấm hiển thị Emoji Picker */}
                    <button
                      type="button"
                      onClick={() => setShowEmojiPicker(prev => !prev)}
                      className={`p-1 text-slate-400/60 hover:text-[#4364F7] transition duration-200 hover:scale-105 active:scale-95 ${showEmojiPicker ? 'text-[#4364F7]' : ''}`}
                      title="Insert Emoji"
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

                    {/* Ô nhập tin nhắn tự động co giãn */}
                    <textarea
                      ref={messageInputRef}
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Type Admin's reply..."
                      rows={1}
                      className="flex-1 max-h-[60px] resize-none bg-transparent text-sm outline-none py-1 text-slate-800 placeholder-slate-400 border-none focus:ring-0 focus:outline-none"
                    />

                    {/* Nút Gửi tin nhắn được căn chỉnh nằm chính giữa hoàn hảo */}
                    <button 
                      type="button"
                      onClick={() => handleSendAdminMessage()}
                      disabled={!inputValue.trim()}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-r from-[#0052D4] via-[#4364F7] to-[#6FB1FC] text-white shadow-sm transition-all duration-200 hover:opacity-95 hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:scale-100 disabled:shadow-none shrink-0"
                      title="Send message"
                    >
                      <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current transform translate-x-[1.5px] translate-y-[0.5px]">
                        <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                      </svg>
                    </button>

                  </div>
                </div>

              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 h-full">
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                  <svg className="w-8 h-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <p className="text-sm font-semibold text-slate-600">Support Chatbox Empty</p>
                <p className="text-xs text-slate-450 mt-1">Select a conversation from the list on the right to start assisting the customer.</p>
              </div>
            )}
          </div>

          {/* SIDEBAR DANH SÁCH KHÁCH HÀNG BÊN PHẢI (1/4) */}
          <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col overflow-hidden h-full">
            
            {/* Header thanh Sidebar */}
            <div className="p-4 border-b border-slate-100 bg-slate-900 text-white flex justify-between items-center shrink-0">
              <div>
                <h2 className="font-bold text-sm tracking-wide">Online Customers</h2>
                <p className="text-[10px] text-slate-400 font-medium">Support conversation rooms</p>
              </div>
              {USE_MOCK && (
                <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider">
                  MOCK MODE
                </span>
              )}
            </div>

            {/* Chỉ số đo lường hiệu năng dạng badge tóm tắt */}
            <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50/50 border-b border-slate-100 text-[11px] font-medium text-slate-500 shrink-0">
              <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-lg border border-slate-200/60 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-slate-400 shrink-0" />
                <span className="truncate">Total: <strong className="text-slate-800">{metrics.total}</strong></span>
              </div>
              <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-lg border border-slate-200/60 shadow-2xs">
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                </span>
                <span className="truncate text-rose-600 font-semibold">Urgent: <strong>{metrics.waiting}</strong></span>
              </div>
              <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-lg border border-slate-200/60 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0 animate-pulse" />
                <span className="truncate text-blue-600">Active: <strong>{metrics.inProgress}</strong></span>
              </div>
              <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-lg border border-slate-200/60 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                <span className="truncate text-emerald-600">Closed: <strong>{metrics.resolved}</strong></span>
              </div>
            </div>

            {/* Ô tìm kiếm và bộ lọc trạng thái */}
            <div className="p-3 border-b border-slate-55 bg-slate-50/30 flex gap-2 shrink-0">
              <div className="relative flex-1">
                <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                  <svg className="h-3.5 w-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </span>
                
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search name..."
                  className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs outline-none bg-white focus:border-[#4364F7] transition"
                />
              </div>

              {/* Bộ lọc phòng chat */}
              <div ref={filterDropdownRef} className="relative">
                <button 
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                  className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white flex items-center gap-1 hover:bg-slate-50 cursor-pointer"
                >
                  <span className="max-w-[70px] truncate">{statusFilter === 'All' ? 'All' : statusFilter === 'waiting_for_admin' ? 'Urgent' : statusFilter === 'in_progress' ? 'Active' : 'Closed'}</span>
                  <svg className="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {isFilterOpen && (
                  <div className="absolute right-0 mt-1 w-32 bg-white border border-slate-150 rounded-lg shadow-lg py-1 z-30">
                    {['All', 'waiting_for_admin', 'in_progress', 'resolved'].map((st) => (
                      <div
                        key={st}
                        onClick={() => { setStatusFilter(st); setIsFilterOpen(false); }}
                        className={`px-3 py-1.5 text-xs cursor-pointer transition ${statusFilter === st ? 'bg-blue-50 font-bold text-blue-600' : 'text-slate-600 hover:bg-slate-50'}`}
                      >
                        {st === 'All' ? 'All' : st === 'waiting_for_admin' ? '🔴 Urgent' : st === 'in_progress' ? '🔵 Active' : '⚪ Closed'}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Danh sách cuộn các cuộc hội thoại trực tuyến */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100/60 scrollbar-thin">
              {sortedChats.length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                  <p className="text-xs">No matching chat rooms found.</p>
                </div>
              ) : (
                sortedChats.map((chat) => {
                  const isActive = activeChat?.userId === chat.userId;
                  const isWaiting = chat.status === 'waiting_for_admin';
                  return (
                    <div
                      key={chat.userId}
                      onClick={() => handleSelectChat(chat)}
                      className={`p-3.5 flex items-start justify-between cursor-pointer transition-all duration-250 border-r-4 ${
                        isActive 
                          ? 'bg-blue-50/40 border-r-[#4364F7]' 
                          : 'border-r-transparent hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex-1 min-w-0 pr-2">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-bold leading-none ${isActive ? 'text-[#4364F7]' : 'text-slate-800'}`}>
                            {chat.name}
                          </span>
                          
                          {/* Đèn nháy đỏ 3D cảnh báo phòng chờ gấp */}
                          {isWaiting && (
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                            </span>
                          )}
                        </div>
                        <p className={`text-xs truncate mt-2 ${isWaiting ? 'text-slate-900 font-bold' : 'text-slate-450'}`}>
                          {chat.lastMessage}
                        </p>
                      </div>
                      <span className="text-[9px] text-slate-400 shrink-0 font-medium">
                        {new Date(chat.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  );
                })
              )}
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};

// Khởi tạo điểm phân phối mặc định tương thích hoàn toàn với trình biên dịch
const App = (props) => <ChatManager {...props} />;
export default App;