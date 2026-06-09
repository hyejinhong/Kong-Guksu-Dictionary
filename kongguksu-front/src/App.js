// App.js
import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "./MainLayout"; // 새로운 MainLayout 임포트
import RestaurantDetailPage from "./components/RestaurantDetail";
import AdminRestaurantSubmissions from "./pages/AdminRestaurantSubmissions";
import MyDictionary from "./pages/MyDictionary";
import V2MainPage from "./v2/pages/V2MainPage";
import V2LoginPage from "./v2/pages/V2LoginPage";
import V2SignupPage from "./v2/pages/V2SignupPage";
import V2SubmissionPage from "./v2/pages/V2SubmissionPage";
import V2RestaurantDetailPage from "./v2/pages/V2RestaurantDetailPage";
import V2SavedRestaurantsPage from "./v2/pages/V2SavedRestaurantsPage";
import V2MyPage from "./v2/pages/V2MyPage";

import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <>
      <Router>
        <Routes>
          {/* V1 -> V2 Redirects */}
          <Route path="/login" element={<Navigate to="/v2/login" replace />} />
          <Route path="/signup" element={<Navigate to="/v2/signup" replace />} />
          <Route path="/mypage" element={<Navigate to="/v2/mypage" replace />} />
          <Route path="/submit-restaurant" element={<Navigate to="/v2/submit" replace />} />
          <Route path="/restaurant/:id" element={<Navigate to="/v2/restaurant/:id" replace />} />
          {/* 나의 사전(visited-restaurants)은 V2의 '저장됨(saved)'과 매칭되므로 리다이렉트 */}
          <Route path="/visited-restaurants" element={<Navigate to="/v2/saved" replace />} />

          <Route path="/v2/login" element={<V2LoginPage />} />
          <Route path="/v2/signup" element={<V2SignupPage />} />
          <Route path="/v2/submit" element={<V2SubmissionPage />} />
          <Route path="/v2/restaurant/:id" element={<V2RestaurantDetailPage />} />
          <Route path="/v2/saved" element={<V2SavedRestaurantsPage />} />
          <Route path="/v2/mypage" element={<V2MyPage />} />
          
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Navigate to="/v2" replace />} />
            {/* 관리자 페이지는 아직 V2가 없으므로 V1 유지 */}
            <Route path="/admin/restaurant-submissions" element={<AdminRestaurantSubmissions />} />
          </Route>

          <Route path="/v2/*" element={<V2MainPage />} />
        </Routes>
      </Router>
      <Toaster position="top-right" reverseOrder={false} />
    </>
  );
}

export default App;