import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import AdminRestaurantSubmissions from './pages/AdminRestaurantSubmissions';
import Login from './pages/Login';
import AdminRestaurantList from './pages/AdminRestaurantList';
import AdminRestaurantEdit from './pages/AdminRestaurantEdit';
import AdminUserList from './pages/AdminUserList';
import AdminRestaurantReports from './pages/AdminRestaurantReports';

// JWT 토큰 파싱
const parseJwt = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error("Failed to parse token:", e);
    return null;
  }
};

// 토큰 만료 여부 확인
const isTokenExpired = (token) => {
  if (!token) return true;

  const payload = parseJwt(token);
  if (!payload || !payload.exp) {
    // exp 필드가 없으면 유효하지 않은 토큰으로 간주
    return true;
  }

  // payload.exp는 유닉스 타임스탬프 (초 단위)이므로 1000을 곱하여 밀리초로 변환
  const expirationTimeMs = payload.exp * 1000;

  // 현재 시간 (밀리초)
  const currentTimeMs = Date.now();

  // 만료 시간(exp)이 현재 시간보다 작으면 만료됨
  return expirationTimeMs < currentTimeMs;
};

// 헤더 컴포넌트 (홈 버튼 및 로그아웃 버튼 포함)
const Header = ({ onLogout }) => {
  return (
    <header className="bg-white shadow-md p-4 flex justify-between items-center">
      <div className="text-2xl font-bold text-gray-800">
        <Link to="/">콩국수사전 관리자</Link>
      </div>
      <div className="flex space-x-4">
        <Link
          to="/"
          className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
        >
          🏠 홈
        </Link>
        <button
          onClick={onLogout}
          className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
        >
          로그아웃
        </button>
      </div>
    </header>
  );
};

// 홈 페이지 컴포넌트 (링크 수정 완료)
const HomePage = () => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 text-gray-800 p-4">
    <h1 className="text-4xl font-bold mb-4 text-center">관리자 대시보드 🛠️</h1>
    <p className="text-lg mb-8 text-center">환영합니다! 관리 기능을 선택해주세요.</p>
    <nav className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
      {/* 🍽️ 식당 등록 요청 관리 링크 */}
      <Link
        to="/restaurants/submissions"
        className="px-6 py-3 bg-yellow-500 text-white font-semibold rounded-lg shadow-md hover:bg-yellow-600 transition-colors duration-200 text-center"
      >
        🍽️ 식당 등록 요청 관리
      </Link>
      {/* 🍜 등록된 식당 전체 관리 링크 (AdminRestaurantList 연결) */}
      <Link
        to="/restaurants/list"
        className="px-6 py-3 bg-green-500 text-white font-semibold rounded-lg shadow-md hover:bg-green-600 transition-colors duration-200 text-center"
      >
        🍜 등록 식당 전체 관리
      </Link>
      {/* 🚩 식당 정보 수정 제보 관리 링크 */}
      <Link
        to="/restaurants/reports"
        className="px-6 py-3 bg-red-500 text-white font-semibold rounded-lg shadow-md hover:bg-red-600 transition-colors duration-200 text-center"
      >
        🚩 식당 수정 제보 관리
      </Link>
      {/* 👤 사용자 관리 링크 */}
      <Link
        to="/users"
        className="px-6 py-3 bg-blue-500 text-white font-semibold rounded-lg shadow-md hover:bg-blue-600 transition-colors duration-200 text-center"
      >
        👤 사용자 관리
      </Link>
    </nav>
  </div>
);


// 메인 App 컴포넌트
function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // 토큰 유효성 검사 (아주 기본적인 로직)
  useEffect(() => {
    const token = localStorage.getItem('admin_token');

    // 1. 토큰 존재 및 만료 검사
    if (token) {
      if (!isTokenExpired(token)) {
        // 토큰이 존재하고 만료되지 않음
        setIsAuthenticated(true);
      } else {
        // 토큰은 있으나 만료됨
        localStorage.removeItem('admin_token');
        console.warn("관리자 토큰이 만료되었습니다. 다시 로그인해주세요.");
      }
    }
    setIsLoading(false); // 로딩 종료
  }, []);

  // 로그인 성공 시 호출될 함수
  const handleLogin = (token) => {
    localStorage.setItem('admin_token', token);
    setIsAuthenticated(true);
    navigate('/');
  };

  // 로그아웃 시 호출될 함수
  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    setIsAuthenticated(false);
    navigate('/');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <p className="text-xl font-medium text-gray-700">인증 정보 확인 중...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="App">
      <Header onLogout={handleLogout} />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/restaurants/submissions" element={<AdminRestaurantSubmissions />} />
        <Route path="/restaurants/list" element={<AdminRestaurantList />} />
        <Route path="/restaurants/reports" element={<AdminRestaurantReports />} />
        <Route path="/users" element={<AdminUserList />} />
        <Route path="/restaurants/edit/:id" element={<AdminRestaurantEdit />} />
      </Routes>
    </div>
  );
}

// App 컴포넌트를 Router로 감싸서 useNavigate 사용 가능하게 함
const AppWrapper = () => (
  <Router>
    <App />
  </Router>
);

export default AppWrapper;
