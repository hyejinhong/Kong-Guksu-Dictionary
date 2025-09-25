import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const SignupPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: "",
    nickname: "",
    password: "",
  });

  const [isLoadingNickname, setIsLoadingNickname] = useState(false); // 필요하다면 주석 해제
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const generateRandomNickname = async () => {
    // if (isLoadingNickname) return; // 로딩 중이면 함수 실행 막기

    try {
      // setIsLoadingNickname(true); // 로딩 시작

      // API 기본 URL과 엔드포인트를 합쳐 요청 URL 생성
      const url = `${API_BASE_URL || 'http://localhost:8080'}/users/nickname/random`;
      console.log("랜덤 닉네임 API 호출:", url);

      // GET 요청 보내기
      const response = await axios.get(url);

      console.log("랜덤 닉네임 API 응답:", response.data);

      // ✅ 응답 데이터 구조에서 닉네임 추출 (response.data.data)
      if (response.data && response.data.code === 0 && response.data.data) {
         const fetchedNickname = response.data.data;

         // 추출한 닉네임으로 nickname 상태 업데이트
         setFormData((prev) => ({ ...prev, nickname: fetchedNickname }));
         console.log("닉네임 업데이트 완료:", fetchedNickname);

      } else {
         // 응답 형식 오류 또는 code가 0이 아닌 경우
         console.error("랜덤 닉네임 API 응답 오류:", response.data?.message || "응답 형식이 올바르지 않습니다.");
         alert("랜덤 닉네임을 가져오는데 실패했습니다."); // 사용자에게 알림
      }

    } catch (error) {
      // API 호출 자체 실패 (네트워크 문제 등)
      console.error("랜덤 닉네임 생성 API 호출 오류:", error);

      if (error.response) {
        // 서버가 응답을 반환했지만 상태 코드가 2xx 범위를 벗어난 경우
        console.error("Error response data:", error.response.data);
        console.error("Error response status:", error.response.status);
        console.error("Error response headers:", error.response.headers);
        alert(`랜덤 닉네임 API 오류: ${error.response.status}`);
      } else if (error.request) {
        // 요청이 만들어졌지만 응답을 받지 못한 경우 (네트워크 문제)
        console.error("Error request:", error.request);
        alert("랜덤 닉네임 서버에 연결할 수 없습니다. 네트워크 상태를 확인하세요.");
      } else {
        // 요청 설정 중 발생한 오류
        console.error("Error message:", error.message);
        alert(`랜덤 닉네임 요청 오류: ${error.message}`);
      }

      alert("랜덤 닉네임을 가져오는데 실패했습니다."); // 사용자에게 알림
    } finally {
      // setIsLoadingNickname(false); // 로딩 종료 (성공/실패와 무관하게)
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("회원가입 정보:", formData);
  
    try {
      const url = `${API_BASE_URL || 'http://localhost:8080'}/auth/signup`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
          nickname: formData.nickname,
        }),
      });
  
      const result = await response.json();
      if (result.code === 0) {
        console.log("회원가입 성공:", result.message);
        navigate("/login");
      } else {
        console.error("회원가입 실패:", result.message);
        alert(result.message || "회원가입에 실패했습니다.");
      }
    } catch (error) {
      console.error("서버 요청 실패:", error);
      alert("회원가입에 실패했습니다. " + error);
    }
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
