import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

const LoginPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
  
    try {
      const response = await axios.post(`${API_BASE_URL}/login`, {
        username,
        password,
      });
  
      const { token } = response.data.data; // ✅ "data" 객체 안의 "token"
  
      // 토큰 저장
      localStorage.setItem("token", token);
  
      // 토큰 디코딩해서 role 추출
      const payload = JSON.parse(atob(token.split('.')[1]));
      localStorage.setItem("role", payload.role); // 예: "USER" 또는 "ADMIN"
  
      // 홈으로 이동
      navigate("/");
    } catch (error) {
      alert("로그인 실패! 아이디 또는 비밀번호를 확인하세요.");
      console.error("Login error:", error);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#FCEBB6]">
      <div className="bg-white p-6 rounded-lg shadow-md w-80">
        <h2 className="text-2xl font-bold text-center mb-4">로그인</h2>
        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label className="block text-sm font-medium">ID</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-2 border rounded mt-1"
              placeholder="아이디 입력"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium">비밀번호</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 border rounded mt-1"
              placeholder="비밀번호 입력"
              required
            />
          </div>
          <button
            type="submit"
            className="bg-[#57B4BA] w-full bg-blue-500 text-white py-2 rounded"
          >
            로그인
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
