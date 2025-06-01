// src/layouts/BaseLayout.js
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

function BaseLayout({ children }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkTokenValidity = () => {
      const token = localStorage.getItem("token");
      const tokenExpiry = localStorage.getItem("exp");

      if (token && tokenExpiry) {
        const currentTime = Math.floor(Date.now() / 1000); // 현재 시간을 초 단위로
        const expiryTimeInSeconds = Math.floor(parseInt(tokenExpiry) / 1000); // 밀리초를 초 단위로 변환

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

  const handleLogout = () => {
    console.log("Logout called from BaseLayout");
    localStorage.removeItem("token");
    localStorage.removeItem("exp");
    localStorage.removeItem("role");
    setIsLoggedIn(false);
    navigate("/login");
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
        <button className="flex flex-col items-center">
          <span>📌</span>
          <span>찜한 식당</span>
        </button>
        <button className="flex flex-col items-center">
          <span>💬</span>
          <span>커뮤니티</span>
        </button>
        <button className="flex flex-col items-center">
          <span>⚙</span>
          <span>설정</span>
        </button>
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
    </div>
  );
}

export default BaseLayout;