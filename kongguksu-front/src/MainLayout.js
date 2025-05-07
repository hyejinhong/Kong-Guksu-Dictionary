// src/MainLayout.js
import React, { useState, useEffect } from "react";
import { Routes, Route, Link, useNavigate } from "react-router-dom";
import KakaoMap from "./components/KakaoMap";
import RestaurantDetail from "./components/RestaurantDetail";
import RestaurantSubmissionForm from "./components/RestaurantSubmissionForm";
import AdminRestaurantSubmissions from "./pages/AdminRestaurantSubmissions";
import LoginPage from "./pages/LoginPage"; // LoginPage 임포트
import SignupPage from "./pages/SignupPage";
import axios from "axios";

function MainLayout() {
  const [filter, setFilter] = useState({ season: "all", beanType: "all" });
  const [restaurants, setRestaurants] = useState([]);
  const [location, setLocation] = useState({ latitude: null, longitude: null });

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();

  // ✅ 컴포넌트 마운트 시 localStorage 확인 (초기 로딩 시 상태 설정)
  useEffect(() => {
    console.log("MainLayout mounted or relevant state changed, checking token...");
    const token = localStorage.getItem("token");
    if (token) {
       // TODO: 토큰 유효성 검증 로직 (필수)
       // 유효한 토큰이면 setIsLoggedIn(true);
       // 무효하거나 만료된 토큰이면 localStorage.removeItem('token'); setIsLoggedIn(false);
       setIsLoggedIn(true); // 일단 토큰 존재하면 로그인으로 간주
    } else {
       setIsLoggedIn(false);
    }
  }, []); // ✅ 의존성 배열이 비어 있으므로 마운트 시 한 번만 실행

  // --- 기존 위치 정보 및 식당 데이터 로딩 로직 (생략) ---
   useEffect(() => { /* ... 위치 정보 가져오기 및 fetchRestaurants 호출 ... */
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setLocation({ latitude, longitude });
          fetchRestaurants(latitude, longitude);
        },
        (error) => {
          console.error("위치 정보를 가져올 수 없습니다:", error);
          fetchRestaurants(null, null);
        }
      );
    }, []); // 마운트 시에만 실행

   const fetchRestaurants = async (latitude, longitude) => { /* ... 비동기 데이터 로딩 ... */
     try {
       const url = `${process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080'}/restaurants/nearby`;
       const params = { latitude, longitude, distance: 5, page: 0, size: 50 };
       if (latitude === null || longitude === null) {
          delete params.latitude; delete params.longitude; delete params.distance;
       }
       const response = await axios.get(url, { params });
       setRestaurants(response.data?.data ?? []);
     } catch (error) {
       console.error("식당 데이터를 불러오는 중 오류 발생:", error);
     }
   };

   const handleFilterChange = (type, value) => { /* ... 필터 변경 로직 ... */
     setFilter((prevFilter) => ({ ...prevFilter, [type]: value }));
   };

   const filteredRestaurants = restaurants.filter((restaurant) => { /* ... 필터링 로직 ... */
     const isSeasonMatch = filter.season === "all" || (filter.season === "open-now" && isCurrentlySelling(restaurant)) || (filter.season === "always" && restaurant.servesAllYear);
     const isBeanTypeMatch = filter.beanType === "all" || (filter.beanType === "백태콩" && restaurant.beanTypes.includes("SOY_BEAN")) || (filter.beanType === "검은콩" && restaurant.beanTypes.includes("BLACK_BEAN"));
     return isSeasonMatch && isBeanTypeMatch;
   });

   function isCurrentlySelling(restaurant) { /* ... 판매 기간 확인 로직 ... */
     const { startMonth, endMonth, servesAllYear } = restaurant;
     const currentMonth = new Date().getMonth() + 1;
     if (servesAllYear) return true;
     if (startMonth === null || endMonth === null) return false;
     if (startMonth <= endMonth) { return currentMonth >= startMonth && currentMonth <= endMonth; }
     else { return currentMonth >= startMonth || currentMonth <= endMonth; }
   }
  // --- 기존 로직 끝 ---


  // ✅ 로그인 성공 시 호출될 함수: 상태 변경 및 페이지 이동
  const handleLoginSuccess = () => {
    console.log("Login Success Callback called in MainLayout");
    setIsLoggedIn(true); // 로그인 상태 true로 업데이트 (즉시 반영됨)
    navigate("/"); // 홈으로 이동
  };

  // ✅ 로그아웃 처리 함수
  const handleLogout = () => {
    console.log("Logout called");
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    setIsLoggedIn(false); // 로그인 상태 false로 업데이트
    navigate("/login"); // 로그인 페이지로 이동
  };


  return (
    <div className="flex flex-col min-h-screen bg-[#FCEBB6]">
      <header className="bg-[#5C5C5C] text-white py-4 text-xl md:text-2xl font-bold flex justify-end items-center px-4 relative">
        <h1 className="absolute left-1/2 transform -translate-x-1/2">
          🍜 콩국수 사전 🍜
        </h1>
        {/* ✅ isLoggedIn 상태에 따라 버튼 조건부 렌더링 */}
        {isLoggedIn ? (
          <button
            onClick={handleLogout}
            className="bg-[#57B4BA] text-white px-3 py-1 rounded-md text-sm"
          >
            로그아웃
          </button>
        ) : (
          <Link to="/login" className="bg-[#57B4BA] text-white px-3 py-1 rounded-md text-sm">
            로그인
          </Link>
        )}
      </header>

      <Routes>
        {/* 홈페이지 라우트 */}
        <Route path="/" element={
          <>
            <div className="flex justify-center my-4">
              <KakaoMap restaurants={filteredRestaurants} />
            </div>
             {/* 필터 메뉴 */}
             <div className="flex flex-wrap justify-center bg-white p-4 rounded-lg mx-4">
               {/* 필터 옵션들... (생략) */}
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input type="radio" name="beanType" value="all" checked={filter.beanType === "all"} onChange={() => handleFilterChange("beanType", "all")} />
                    <span className="ml-2">전체</span>
                  </label>
                  <label className="flex items-center">
                    <input type="radio" name="beanType" value="백태콩" checked={filter.beanType === "백태콩"} onChange={() => handleFilterChange("beanType", "백태콩")} />
                    <span className="ml-2">백태콩</span>
                  </label>
                  <label className="flex items-center">
                    <input type="radio" name="beanType" value="검은콩" checked={filter.beanType === "검은콩"} onChange={() => handleFilterChange("beanType", "검은콩")} />
                    <span className="ml-2">검은콩</span>
                  </label>
                </div>
                <div className="flex space-x-4 mt-2">
                  <label className="flex items-center">
                    <input type="radio" name="season" value="all" checked={filter.season === "all"} onChange={() => handleFilterChange("season", "all")} />
                    <span className="ml-2">전체</span>
                  </label>
                  <label className="flex items-center">
                    <input type="radio" name="season" value="always" checked={filter.season === "always"} onChange={() => handleFilterChange("season", "always")} />
                    <span className="ml-2">사계절</span>
                  </label>
                  <label className="flex items-center">
                    <input type="radio" name="season" value="open-now" checked={filter.season === "open-now"} onChange={() => handleFilterChange("season", "open-now")} />
                    <span className="ml-2">현재 콩국수 개시</span>
                  </label>
                </div>
              </div>
            {/* 추천 식당 리스트 */}
            <div className="mx-4 mt-4">
              {filteredRestaurants.map((restaurant) => (
                <Link key={restaurant.id} to={`/restaurant/${restaurant.id}`} className="block">
                  <div className="bg-white p-4 mb-2 rounded-lg shadow-md">
                    <p className="font-bold text-lg">{restaurant.name}</p>
                    <p className="text-sm text-gray-600">{restaurant.address}</p>
                    <p className="text-sm">
                      거리: {restaurant.distance?.toFixed(1)}km
                    </p>
                    <p className="text-sm">
                       콩 종류:
                       {restaurant.beanTypes.map((type, index) => (
                         <span key={type}>
                           {type === "SOY_BEAN" ? "백태콩" : type === "BLACK_BEAN" ? "검은콩" : type}
                           {index < restaurant.beanTypes.length - 1 ? " " : ""}
                         </span>
                       ))}
                     </p>
                    <p className="text-sm">
                      판매 기간: {restaurant.servesAllYear ? "사계절 판매" : `${restaurant.startMonth}월 ~ ${restaurant.endMonth}월`}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </>
        } />

        <Route path="/restaurant/:id" element={<RestaurantDetail restaurants={restaurants} />} />
        {/* ✅ LoginPage 컴포넌트에 handleLoginSuccess 함수를 props로 전달 */}
        <Route path="/login" element={<LoginPage onLoginSuccess={handleLoginSuccess} />} />
        <Route path="/signup" element={<SignupPage />} />

        {/* TODO: 식당 등록 및 관리자 페이지는 로그인/권한 상태에 따라 접근 제어 필요 */}
        <Route path="/submit-restaurant" element={<RestaurantSubmissionForm />} />
        {/* 관리자 페이지 라우트 (TODO: 권한 체크 필요) */}
        <Route path="/admin/restaurant-submissions" element={<AdminRestaurantSubmissions />} />
      </Routes>

      {/* 네비게이션 바 */}
      <nav className="bg-[#5C5C5C] text-white p-4 flex justify-around text-sm md:text-lg fixed bottom-0 w-full">
        <Link to="/" className="flex flex-col items-center">
          <span>🏠</span>
          <span>홈</span>
        </Link>
        <button className="flex flex-col items-center">
          <span>📌</span>
          <span>찜한 식당</span>
        </button>
        <button className="flex flex-col items-center">
          <span>💬</span>
          <span>커뮤니티</span>
        </button>
        <button className="flex flex-col items-center">
          <span>⚙</span>
          <span>설정</span>
        </button>
         {/* 식당 등록 페이지 링크 */}
         <Link to="/submit-restaurant" className="flex flex-col items-center">
            <span>📝</span>
            <span>식당 등록</span>
          </Link>
           {/* 관리자 페이지 링크 (TODO: 권한 체크 필요) */}
          {localStorage.getItem("role") === "ADMIN" && ( // 예시: role이 "ADMIN"일 때만 표시
             <Link to="/admin/restaurant-submissions" className="flex flex-col items-center">
               <span>🔒</span> {/* 자물쇠 아이콘 */}
               <span>관리자</span>
             </Link>
          )}
      </nav>
    </div>
  );
}

export default MainLayout;