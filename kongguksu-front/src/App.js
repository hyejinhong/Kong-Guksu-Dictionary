// src/App.js
import React from "react";
// BrowserRouter만 필요합니다.
import { BrowserRouter as Router } from "react-router-dom";
import MainLayout from "./MainLayout"; // 새로 생성한 MainLayout 컴포넌트 임포트
import "./index.css"; // 스타일 시트 임포트는 그대로 유지

function App() {
  return (
    // ✅ BrowserRouter 안에 MainLayout을 렌더링합니다.
    // MainLayout과 그 자식 컴포넌트들은 라우팅 컨텍스트를 사용할 수 있게 됩니다.
    <Router>
      <MainLayout />
    </Router>
  );
}

export default App;