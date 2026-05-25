// App.js
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import MainLayout from "./MainLayout"; // 새로운 MainLayout 임포트
import HomePage from "./pages/Homepage";
import RestaurantDetailPage from "./components/RestaurantDetail";
import RestaurantSubmissionForm from "./components/RestaurantSubmissionForm";
import AdminRestaurantSubmissions from "./pages/AdminRestaurantSubmissions";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import MyDictionary from "./pages/MyDictionary";
import MyPageProfile from "./pages/MyPageProfile";
import V2MainPage from "./v2/pages/V2MainPage";
import V2LoginPage from "./v2/pages/V2LoginPage";
import V2SignupPage from "./v2/pages/V2SignupPage";

import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/v2/login" element={<V2LoginPage />} />
          <Route path="/v2/signup" element={<V2SignupPage />} />
          <Route path="/" element={<MainLayout />}> {/* MainLayout으로 감싸기 */}
            <Route index element={<HomePage />} /> {/* index 라우트로 홈페이지 설정 */}
            <Route path="/restaurant/:id" element={<RestaurantDetailPage />} />
            <Route path="/visited-restaurants" element={<MyDictionary />} />
            <Route path="/submit-restaurant" element={<RestaurantSubmissionForm />} />
            <Route path="/admin/restaurant-submissions" element={<AdminRestaurantSubmissions />} />
            <Route path="/mypage" element={<MyPageProfile />} />
          </Route>

          <Route path="/v2/*" element={<V2MainPage />} />
        </Routes>
      </Router>
      <Toaster position="top-right" reverseOrder={false} />
    </>
  );
}

export default App;