import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import { jwtDecode } from 'jwt-decode';
import { toast } from 'react-hot-toast';
import api from '../api';

const NotificationContext = createContext(null);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const stompClientRef = useRef(null);

  // Poll localStorage to detect token changes (login/logout/token updates)
  useEffect(() => {
    const interval = setInterval(() => {
      const currentToken = localStorage.getItem('token');
      if (currentToken !== token) {
        setToken(currentToken);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [token]);

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';

  const checkLoggedIn = () => {
    const token = localStorage.getItem('token');
    const exp = localStorage.getItem('exp');
    if (!token || !exp) return false;

    const now = Math.floor(Date.now() / 1000);
    // Convert ms timestamp to seconds for proper comparison (matching BaseLayout.js)
    const expiryTimeInSeconds = Math.floor(Number(exp) / 1000);
    return now < expiryTimeInSeconds;
  };

  const getUsernameFromToken = (token) => {
    try {
      const decoded = jwtDecode(token);
      return decoded.sub;
    } catch (error) {
      console.error('Invalid token', error);
      return null;
    }
  };

  const fetchNotifications = useCallback(async () => {
    if (!checkLoggedIn()) return;
    try {
      const [notiRes, userRes] = await Promise.allSettled([
        api.get('/notifications'),
        api.get('/users/me')
      ]);

      let list = [];
      if (notiRes.status === 'fulfilled' && notiRes.value.data?.code === 0) {
        list = notiRes.value.data.data || [];
      }

      let hasNoEmail = false;
      if (userRes.status === 'fulfilled' && userRes.value.data?.data) {
        const userEmail = userRes.value.data.data.email;
        if (!userEmail) {
          hasNoEmail = true;
        }
      }

      if (hasNoEmail) {
        const noEmailNoti = {
          id: 'no-email-warning-system',
          type: '계정 보안',
          title: '이메일 미등록 안내',
          content: '아이디/비밀번호 분실 방지를 위해 마이페이지에서 이메일을 등록해 주세요!',
          isNoEmailWarning: true
        };
        if (!list.some(n => n.isNoEmailWarning)) {
          list = [noEmailNoti, ...list];
        }
        setUnread(true);
      }

      setNotifications(list);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  }, []);

  // Show customized Soy-themed toast notification
  const showNotificationToast = (notification) => {
    toast.custom((t) => (
      <div
        className={`${
          t.visible ? 'animate-enter' : 'animate-leave'
        } max-w-md w-full bg-[#FDF9ED] shadow-[0_10px_30px_rgba(105,94,52,0.15)] rounded-[2rem] pointer-events-auto flex p-4 border border-[#EBE4C9]`}
        onClick={() => {
          setIsModalOpen(true);
          toast.dismiss(t.id);
        }}
      >
        <div className="flex-1 w-0 cursor-pointer">
          <div className="flex items-start">
            <div className="flex-shrink-0 pt-0.5">
              <span className="material-symbols-outlined text-[#695E34] text-2xl">notifications_active</span>
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-black text-[#695E34]">
                {notification.type || '알림'}
              </p>
              <p className="mt-1 text-xs font-bold text-[#695E34]/80">
                {notification.content || '새로운 알림이 도착했습니다.'}
              </p>
            </div>
          </div>
        </div>
        <div className="flex border-l border-[#EBE4C9] pl-3 ml-3 justify-center items-center">
          <button
            onClick={(e) => {
              e.stopPropagation();
              toast.dismiss(t.id);
            }}
            className="text-xs font-black text-[#695E34]/60 hover:text-[#695E34] focus:outline-none"
          >
            닫기
          </button>
        </div>
      </div>
    ), { duration: 5000 });
  };

  useEffect(() => {
    const isLoggedIn = checkLoggedIn();

    if (!isLoggedIn || !token) {
      if (stompClientRef.current) {
        console.log('🔌 STOMP V2 Deactivating (logged out or no token)');
        stompClientRef.current.deactivate();
        stompClientRef.current = null;
      }
      return;
    }

    if (stompClientRef.current) return;

    const username = getUsernameFromToken(token);
    if (!username) return;

    // Fetch notifications on initial load
    fetchNotifications();

    console.log('🔌 STOMP V2 Connecting for user:', username);
    const socket = new SockJS(`${API_BASE_URL}/ws?token=${token}`);
    const client = new Client({
      webSocketFactory: () => socket,
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      debug: (str) => console.log('[STOMP V2]', str),
      reconnectDelay: 5000,
      onConnect: () => {
        console.log('✅ STOMP V2 Connected!');
        client.subscribe(`/topic/notifications/${username}`, (message) => {
          try {
            const notification = JSON.parse(message.body);
            console.log('📨 V2 알림 수신:', notification);
            
            setNotifications((prev) => [notification, ...prev]);
            setUnread(true);
            showNotificationToast(notification);
          } catch (e) {
            console.error('Error parsing notification message:', e);
          }
        });
      },
      onStompError: (frame) => {
        console.error('❌ STOMP V2 Broker error:', frame);
      },
      onWebSocketError: (event) => {
        console.error('❌ STOMP V2 WebSocket error:', event);
      },
    });

    stompClientRef.current = client;
    client.activate();

    return () => {
      if (stompClientRef.current) {
        console.log('🔌 STOMP V2 Cleaning up (deactivating)');
        stompClientRef.current.deactivate();
        stompClientRef.current = null;
      }
    };
  }, [token, fetchNotifications]);

  const openModal = () => {
    fetchNotifications();
    setUnread(false);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unread,
        isModalOpen,
        openModal,
        closeModal,
        fetchNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
