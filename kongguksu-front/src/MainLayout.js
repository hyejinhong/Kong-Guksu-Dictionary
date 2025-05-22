// src/MainLayout.js
import React from "react";
import BaseLayout from "./layouts/BaseLayout"; // BaseLayout 임포트
import { Outlet } from "react-router-dom"; // Outlet 임포트

function MainLayout() {
  return (
    <BaseLayout>
      <Outlet /> {/* 현재 라우트에 매칭되는 컴포넌트가 이 위치에 렌더링됩니다. */}
    </BaseLayout>
  );
}

export default MainLayout;