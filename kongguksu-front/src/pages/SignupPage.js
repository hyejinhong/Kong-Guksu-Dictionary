import React, { useState } from "react";

const randomNicknames = ["콩순이", "콩닥콩닥", "콩국수왕", "콩마스터", "콩러버"];

const SignupPage = () => {
  const [formData, setFormData] = useState({
    username: "",
    nickname: "",
    password: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const generateRandomNickname = () => {
    const randomNickname = randomNicknames[Math.floor(Math.random() * randomNicknames.length)];
    setFormData((prev) => ({ ...prev, nickname: randomNickname }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("회원가입 정보:", formData);
    // TODO: 서버로 회원가입 요청 보내기
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-[#FCEBB6]">
      <div className="bg-white p-6 rounded-lg shadow-md w-80">
        <h2 className="text-2xl font-bold text-center text-[#5C5C5C] mb-4">회원가입</h2>
        <form onSubmit={handleSubmit} className="flex flex-col space-y-3">
          <input
            type="text"
            name="username"
            placeholder="아이디"
            value={formData.username}
            onChange={handleChange}
            className="border rounded-md p-2 w-full"
            required
          />
          <div className="flex space-x-2">
            <input
              type="text"
              name="nickname"
              placeholder="닉네임"
              value={formData.nickname}
              onChange={handleChange}
              className="border rounded-md p-2 flex-1"
            />
            <button
              type="button"
              onClick={generateRandomNickname}
              className="bg-[#D95E23] text-white px-3 py-2 rounded-md hover:bg-[#B8501E] transition"
            >
              닉네임 생성
            </button>
          </div>
          <input
            type="password"
            name="password"
            placeholder="비밀번호"
            value={formData.password}
            onChange={handleChange}
            className="border rounded-md p-2 w-full"
            required
          />
          <button type="submit" className="bg-[#5C5C5C] text-white p-2 rounded-md hover:bg-[#3D3D3D] transition">
            회원가입
          </button>
        </form>
      </div>
    </div>
  );
};

export default SignupPage;
