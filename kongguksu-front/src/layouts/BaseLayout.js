import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import NotificationModal from "../components/NotificationModal";
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import { jwtDecode } from 'jwt-decode';

function BaseLayout({ children }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const navigate = useNavigate();

  const stompClientRef = useRef(null);

  useEffect(() => {
    const checkTokenValidity = () => {
      const token = localStorage.getItem("token");
      const tokenExpiry = localStorage.getItem("exp");

      if (token && tokenExpiry) {
        const currentTime = Math.floor(Date.now() / 1000);
        const expiryTimeInSeconds = Math.floor(parseInt(tokenExpiry) / 1000);

        if (expiryTimeInSeconds > currentTime) {
          setIsLoggedIn(true);
        } else {
          setIsLoggedIn(false);
          localStorage.removeItem("token");
          localStorage.removeItem("exp");
          localStorage.removeItem("role");
        }
      } else {
        setIsLoggedIn(false);
      }
      setLoading(false);
    };

    checkTokenValidity();
  }, []);

  useEffect(() => {
    if (!isLoggedIn) {
      // 로그아웃 상태면 연결 종료
      if (stompClientRef.current) {
        stompClientRef.current.deactivate();
        stompClientRef.current = null;
      }
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) return;

    function getUsernameFromToken(token) {
      try {
        const decoded = jwtDecode(token);
        return decoded.sub;
      } catch (error) {
        console.error("Invalid token", error);
        return null;
      }
    }

    const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

    if (stompClientRef.current) {
      // 이미 연결되어 있으면 재활용
      return;
    }

    const socket = new SockJS(`${API_BASE_URL}/ws`);

    const client = new Client({
      webSocketFactory: () => socket,
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      debug: (str) => console.log('[STOMP]', str),
      reconnectDelay: 5000,
      onConnect: () => {
        console.log('✅ WebSocket Connected!');
        const username = getUsernameFromToken(token);
        console.log("📛 Username from token:", username);

        client.subscribe(`/topic/notifications/${username}`, (message) => {
          const notification = JSON.parse(message.body);
          console.log("📨 알림 도착!", notification);
          setNotifications((prev) => [...prev, notification]);
        });
      },
      onStompError: (frame) => {
        console.error('❌ Broker error:', frame);
      },
      onWebSocketError: (event) => {
        console.error('❌ WebSocket error:', event);
      },
    });

    stompClientRef.current = client;
    client.activate();

    // 언마운트 혹은 로그아웃 시 연결 끊기
    return () => {
      if (stompClientRef.current) {
        stompClientRef.current.deactivate();
        stompClientRef.current = null;
      }
    };
  }, [isLoggedIn]);

  const handleLogout = () => {
    console.log("Logout called from BaseLayout");
    localStorage.removeItem("token");
    localStorage.removeItem("exp");
    localStorage.removeItem("role");
    setIsLoggedIn(false);
    navigate("/login");
  };

  const handleNotificationClick = () => {
    setShowNotificationModal(true);
  };

  if (loading) {
    return <div>로딩 중...</div>;
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#FCEBB6]">
      <header className="bg-[#5C5C5C] text-white py-4 text-xl md:text-2xl font-bold flex justify-end items-center px-4 relative">
        <h1 className="absolute left-1/2 transform -translate-x-1/2">
          🍜 콩국수 사전 🍜
        </h1>
        {isLoggedIn && (
          <button onClick={handleNotificationClick} className="mr-2 text-2xl">
            🔔
          </button>
        )}
        {isLoggedIn ? (
          <button
            onClick={handleLogout}
            className="bg-[#57B4BA] text-white px-3 py-1 rounded-md text-sm"
          >
            로그아웃
          </button>
        ) : (
          <Link to="/login" className="bg-[#57B4BA] text-white px-3 py-1 rounded-md text-sm">
            로그인
          </Link>
        )}
      </header>

      <main className="flex-grow pb-16 md:pb-12">
        {children}
      </main>

      <nav className="bg-[#5C5C5C] text-white p-4 flex justify-around text-sm md:text-lg fixed bottom-0 w-full">
        <Link to="/" className="flex flex-col items-center">
          <span>🏠</span>
          <span>홈</span>
        </Link>
        <Link to="/visited-restaurants" className="flex flex-col items-center">
          <span>⭐</span>
          <span>나의 사전</span>
        </Link>
        <Link to="/submit-restaurant" className="flex flex-col items-center">
          <span>📝</span>
          <span>식당 등록</span>
        </Link>
        {localStorage.getItem("role") === "ADMIN" && isLoggedIn && (
          <Link to="/admin/restaurant-submissions" className="flex flex-col items-center">
            <span>🔒</span>
            <span>관리자</span>
          </Link>
        )}
      </nav>

      {showNotificationModal && (
        <NotificationModal
          notifications={notifications}
          onClose={() => setShowNotificationModal(false)}
        />
      )}
    </div>
  );
}

export default BaseLayout;
