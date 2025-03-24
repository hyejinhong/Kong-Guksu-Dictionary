import React, { useState } from "react";
import { BrowserRouter as Router, Route, Routes, Link } from "react-router-dom";
import "./index.css"; // Tailwind 적용
import KakaoMap from "./components/KakaoMap";
import RestaurantDetail from "./components/RestaurantDetail";
import RestaurantSubmissionForm from "./components/RestaurantSubmissionForm";
import AdminRestaurantSubmissions from "./pages/AdminRestaurantSubmissions";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";

// 임시 데이터
const restaurants = [
  { name: "맛집 A", distance: "500m", type: "백태콩", startMonth: 6, endMonth: 9 },
  { name: "맛집 B", distance: "1km", type: "검은콩", startMonth: 11, endMonth: 3 }, // 겨울철 판매
  { name: "맛집 C", distance: "300m", type: "백태콩", startMonth: 5, endMonth: 8 },
];

function App() {
  const [filter, setFilter] = useState({ season: "all", beanType: "all" });

  const handleFilterChange = (type, value) => {
    setFilter((prevFilter) => ({ ...prevFilter, [type]: value }));
  };

  // 필터된 식당 리스트
  const filteredRestaurants = restaurants.filter((restaurant) => {
    const currentMonth = new Date().getMonth() + 1; // 현재 월 (1~12)

    const isSeasonMatch =
      filter.season === "all" ||
      (filter.season === "open-now" && isCurrentlySelling(restaurant));

    const isBeanTypeMatch =
      filter.beanType === "all" || restaurant.type === filter.beanType;

    return isSeasonMatch && isBeanTypeMatch;
  });

  /**
   * 현재 식당이 콩국수를 판매 중인지 확인하는 함수
   */
  function isCurrentlySelling(restaurant) {
    const { startMonth, endMonth } = restaurant;
    const currentMonth = new Date().getMonth() + 1;

    if (startMonth <= endMonth) {
      // 보통의 경우 (예: 6월 ~ 9월)
      return startMonth <= currentMonth && currentMonth <= endMonth;
    } else {
      // 겨울을 넘겨서 판매하는 경우 (예: 11월 ~ 3월)
      return currentMonth >= startMonth || currentMonth <= endMonth;
    }
  }

  return (
    <Router>
      <div className="flex flex-col min-h-screen bg-[#FCEBB6]">

        <header className="bg-[#5C5C5C] text-white py-4 text-xl md:text-2xl font-bold flex justify-end items-center px-4 relative">
          <h1 className="absolute left-1/2 transform -translate-x-1/2">
            🍜 콩국수 사전 🍜
          </h1>
          <Link to="/login" className="bg-[#57B4BA] text-white bg-blue-500 px-3 py-1 rounded-md text-sm">
            로그인
          </Link>
        </header>
        <Routes>
          {/* 홈 페이지 */}
          <Route path="/" element={
            <>
              <div className="flex justify-center my-4">
                <KakaoMap />
              </div>

              {/* 필터 메뉴 */}
              <div className="flex flex-wrap justify-center bg-white p-4 rounded-lg mx-4">
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input type="radio" name="beanType" value="all"
                      checked={filter.beanType === "all"}
                      onChange={() => handleFilterChange("beanType", "all")}
                    />
                    <span className="ml-2">전체</span>
                  </label>
                  <label className="flex items-center">
                    <input type="radio" name="beanType" value="백태콩"
                      checked={filter.beanType === "백태콩"}
                      onChange={() => handleFilterChange("beanType", "백태콩")}
                    />
                    <span className="ml-2">백태콩</span>
                  </label>
                  <label className="flex items-center">
                    <input type="radio" name="beanType" value="검은콩"
                      checked={filter.beanType === "검은콩"}
                      onChange={() => handleFilterChange("beanType", "검은콩")}
                    />
                    <span className="ml-2">검은콩</span>
                  </label>
                </div>

                <div className="flex space-x-4 mt-2">
                  <label className="flex items-center">
                    <input type="radio" name="season" value="all"
                      checked={filter.season === "all"}
                      onChange={() => handleFilterChange("season", "all")}
                    />
                    <span className="ml-2">사계절</span>
                  </label>
                  <label className="flex items-center">
                    <input type="radio" name="season" value="open-now"
                      checked={filter.season === "open-now"}
                      onChange={() => handleFilterChange("season", "open-now")}
                    />
                    <span className="ml-2">현재 콩국수 개시</span>
                  </label>
                </div>
              </div>

              {/* 추천 식당 리스트 */}
              <div className="mx-4 mt-4">
                {filteredRestaurants.map((restaurant, index) => (
                  <Link key={index} to={`/restaurant/${index}`} className="block">
                    <div className="bg-white p-4 mb-2 rounded-lg shadow-md">
                      <p className="font-bold">{restaurant.name}</p>
                      <p>{restaurant.distance}</p>
                      <p>{restaurant.type}</p>
                      <p>{restaurant.startMonth}월~{restaurant.endMonth}월</p>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          } />

          {/* 식당 상세 페이지 */}
          <Route path="/restaurant/:id" element={<RestaurantDetail restaurants={restaurants} />} />
          {/* ✅ 식당 등록 요청 페이지 추가 */}
          <Route path="/submit-restaurant" element={<RestaurantSubmissionForm />} />
          <Route path="/admin/restaurant-submissions" element={<AdminRestaurantSubmissions />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
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
          {/* ✅ 새로운 메뉴 추가 */}
          <Link to="/submit-restaurant" className="flex flex-col items-center">
            <span>📝</span>
            <span>식당 등록</span>
          </Link>
        </nav>
      </div>
    </Router>
  );
}

export default App;
