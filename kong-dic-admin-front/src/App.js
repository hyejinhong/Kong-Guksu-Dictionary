// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';

// 홈 페이지 컴포넌트
const HomePage = () => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 text-gray-800 p-4">
    <h1 className="text-4xl font-bold mb-4 text-center">관리자 대시보드 🛠️</h1>
    <p className="text-lg mb-8 text-center">환영합니다! 관리 기능을 선택해주세요.</p>
    <nav className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
      <Link 
        to="/restaurants" 
        className="px-6 py-3 bg-yellow-500 text-white font-semibold rounded-lg shadow-md hover:bg-yellow-600 transition-colors duration-200 text-center"
      >
        🍽️ 식당 관리
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

// 식당 관리 페이지 컴포넌트
const RestaurantManagementPage = () => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-white text-gray-800 p-4">
    <h2 className="text-3xl font-bold mb-4 text-center">식당 관리 페이지 🍜</h2>
    <p className="text-md text-center">여기서 식당 목록을 보고 승인/수정/삭제 작업을 할 수 있습니다.</p>
    <Link 
      to="/" 
      className="mt-6 px-4 py-2 text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50 hover:text-blue-700 transition-colors duration-200"
    >
      🏠 홈으로 돌아가기
    </Link>
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
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/restaurants" element={<RestaurantManagementPage />} />
          <Route path="/users" element={<UserManagementPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
