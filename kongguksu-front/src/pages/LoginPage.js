import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const LoginPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();

    console.log("ID:", username);
    console.log("비밀번호:", password);

    // TODO: 실제 로그인 API 연동 필요
    // 성공 시 홈으로 이동
    navigate("/");
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
