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
  const [popupNotification, setPopupNotification] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const navigate = useNavigate();
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
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

    if (stompClientRef.current) {
      // 이미 연결되어 있으면 재활용
      return;
    }

    const socket = new SockJS(`${API_BASE_URL}/ws?token=${token}`);

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

          // 팝업 알림 표시
          setPopupNotification(notification);
          setShowPopup(true);

          // 5초 후 팝업 자동 닫기
          setTimeout(() => setShowPopup(false), 5000);
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

  useEffect(() => {
    if (showNotificationModal) {
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
      const username = getUsernameFromToken(token);

      if (!username) {
        console.error("Username not found in token for fetching notifications.");
        return;
      }

      fetch(`${API_BASE_URL}/notifications`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      })
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data.data)) {
            setNotifications(data.data);
          } else {
            console.warn('알림 데이터 형식이 배열이 아님:', data);
          }
        })
        .catch((err) => {
          console.error('알림 불러오기 실패:', err);
        });
    }
  }, [showNotificationModal]);

  const closePopup = () => setShowPopup(false);

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
          // ⭐ 로그인 상태일 때 버튼 그룹 ⭐
          <div className="flex items-center space-x-3">
            {/* 1. 마이페이지 버튼 추가 */}
            <Link
              to="/mypage"
              className="bg-[#57B4BA] text-white px-3 py-1 rounded-md text-sm hover:bg-[#46A2AC] transition-colors"
            >
              내 정보
            </Link>

            {/* 2. 알림 버튼 (기존 유지) */}
            <button onClick={handleNotificationClick} className="text-2xl">
              🔔
            </button>

            {/* 3. 로그아웃 버튼 (기존 유지) */}
            <button
              onClick={handleLogout}
              className="bg-red-500 text-white px-3 py-1 rounded-md text-sm hover:bg-red-600 transition-colors"
            >
              로그아웃
            </button>
          </div>
        )}
        {!isLoggedIn && (
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

      {showPopup && popupNotification && (
        <div
          className="fixed top-5 right-5 bg-[#57B4BA] text-white p-4 rounded shadow-lg cursor-pointer z-50"
          onClick={closePopup}
        >
          {/* 여기서 popupNotification.title 대신 popupNotification.type을 사용합니다. */}
          <strong>{popupNotification.type || "새 알림"}</strong>
          <p>{popupNotification.content || "내용이 없습니다."}</p>
          <small className="block mt-1 text-xs opacity-80 cursor-pointer">✕ 닫기</small>
        </div>
      )}

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