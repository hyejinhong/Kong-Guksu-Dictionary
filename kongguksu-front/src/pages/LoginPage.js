import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom"; // useNavigate 추가
import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

const LoginPage = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate(); // useNavigate 훅 추가

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const url = `${API_BASE_URL || 'http://localhost:8080'}/login`;
      const response = await axios.post(url, {
        username,
        password,
      });

      // 백엔드 응답 구조 확인 (code, message, data)
      if (response.data && response.data.code === 0 && response.data.data && response.data.data.token && response.data.data.exp) {
        const { token, exp } = response.data.data;

        // 토큰 및 만료 시간 저장
        localStorage.setItem("token", token);
        localStorage.setItem("exp", exp);

        // 토큰 디코딩해서 role 추출 및 저장 (에러 처리 추가)
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          localStorage.setItem("role", payload.role);
        } catch (decodeError) {
          console.error("토큰 디코딩 실패:", decodeError);
          alert("로그인 처리 중 오류가 발생했습니다. 다시 시도해주세요.");
          localStorage.removeItem("token");
          localStorage.removeItem("exp");
          localStorage.removeItem("role");
          return; // 함수 실행 중단
        }

        // ✅ localStorage 저장이 완료된 후, 상위 컴포넌트(MainLayout)에게 로그인 성공을 알림
        if (onLoginSuccess) {
          onLoginSuccess(); // MainLayout의 handleLoginSuccess 함수 호출
        }

        // 로그인 성공 후 홈 페이지로 이동
        navigate("/");

      } else {
        // 백엔드 응답 형식이 예상과 다르거나 code가 0이 아닐 경우
        alert(response.data?.message || "로그인 실패! 아이디 또는 비밀번호를 확인하세요.");
        console.error("Login failed with response:", response.data);
      }

    } catch (error) {
      // 네트워크 오류 또는 백엔드에서 4xx, 5xx 응답 반환 시
      if (error.response) {
        console.error("Login error response:", error.response.data);
        alert(error.response.data?.message || "로그인 실패! 아이디 또는 비밀번호를 확인하세요.");
      } else if (error.request) {
        console.error("Login error request:", error.request);
        alert("서버에 연결할 수 없습니다.");
      } else {
        console.error("Login error message:", error.message);
        alert("로그인 요청 중 오류가 발생했습니다.");
      }
      console.error("Login error config:", error.config);
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
          <p className="mt-4 text-center text-sm">
            아직 회원이 아니신가요?{" "}
            <Link to="/signup" className="text-blue-500 hover:underline">회원가입</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;