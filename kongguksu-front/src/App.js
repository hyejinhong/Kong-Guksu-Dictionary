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

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/" element={<MainLayout />}> {/* MainLayout으로 감싸기 */}
          <Route index element={<HomePage />} /> {/* index 라우트로 홈페이지 설정 */}
          <Route path="/restaurant/:id" element={<RestaurantDetailPage />} />
          <Route path="/visited-restaurants" element={<MyDictionary/>}/>
          <Route path="/submit-restaurant" element={<RestaurantSubmissionForm />} />
          <Route path="/admin/restaurant-submissions" element={<AdminRestaurantSubmissions />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;