// src/App.js
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import AdminRestaurantSubmissions from './pages/AdminRestaurantSubmissions'; 
import Login from './pages/Login';

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

// 홈 페이지 컴포넌트
const HomePage = () => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 text-gray-800 p-4">
    <h1 className="text-4xl font-bold mb-4 text-center">관리자 대시보드 🛠️</h1>
    <p className="text-lg mb-8 text-center">환영합니다! 관리 기능을 선택해주세요.</p>
    <nav className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
      <Link 
        to="/restaurants/submissions"
        className="px-6 py-3 bg-yellow-500 text-white font-semibold rounded-lg shadow-md hover:bg-yellow-600 transition-colors duration-200 text-center"
      >
        🍽️ 식당 등록 요청 관리
      </Link>
      <Link 
        to="/users" 
        className="px-6 py-3 bg-blue-500 text-white font-semibold rounded-lg shadow-md hover:bg-blue-600 transition-colors duration-200 text-center"
      >
        👤 사용자 관리
      </Link>
    </nav>
  </div>
);

// 사용자 관리 페이지 컴포넌트
const UserManagementPage = () => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-white text-gray-800 p-4">
    <h2 className="text-3xl font-bold mb-4 text-center">사용자 관리 페이지 🧑‍💻</h2>
    <p className="text-md text-center">여기서 사용자 목록을 보고 계정 정지/권한 변경 작업을 할 수 있습니다.</p>
    <Link 
      to="/" 
      className="mt-6 px-4 py-2 text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50 hover:text-blue-700 transition-colors duration-200"
    >
      🏠 홈으로 돌아가기
    </Link>
  </div>
);

// 메인 App 컴포넌트
function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  // 토큰 유효성 검사 (아주 기본적인 로직)
  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (token) {
      // 실제로는 토큰 만료 여부를 확인하는 로직이 필요하지만,
      // 여기서는 토큰이 존재하기만 하면 유효하다고 가정
      setIsAuthenticated(true);
    }
  }, []);

  // 로그인 성공 시 호출될 함수
  const handleLogin = (token) => {
    localStorage.setItem('admin_token', token);
    setIsAuthenticated(true);
    navigate('/'); // 로그인 후 홈으로 이동
  };

  // 로그아웃 시 호출될 함수
  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    setIsAuthenticated(false);
    navigate('/'); // 로그아웃 후 홈(로그인 페이지)으로 이동
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="App">
      <Header onLogout={handleLogout} />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/restaurants/submissions" element={<AdminRestaurantSubmissions />} />
        <Route path="/users" element={<UserManagementPage />} />
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
