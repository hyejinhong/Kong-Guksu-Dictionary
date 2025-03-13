import React, { useState } from "react";
import { BrowserRouter as Router, Route, Routes, Link } from "react-router-dom";
import "./index.css"; // Tailwind 적용
import KakaoMap from "./components/KakaoMap";
import RestaurantDetail from "./components/RestaurantDetail"; // 추가

// 임시 데이터
const restaurants = [
  { name: "맛집 A", distance: "500m", type: "백태콩" },
  { name: "맛집 B", distance: "1km", type: "검은콩" },
  { name: "맛집 C", distance: "300m", type: "백태콩" },
];

function App() {
  const [filter, setFilter] = useState({ season: "all", beanType: "all" });

  const handleFilterChange = (type, value) => {
    setFilter((prevFilter) => ({ ...prevFilter, [type]: value }));
  };

  // 필터된 식당 리스트
  const filteredRestaurants = restaurants.filter((restaurant) => {
    return (
      (filter.season === "all" || filter.season === "year-round") &&
      (filter.beanType === "all" || restaurant.type === filter.beanType)
    );
  });

  return (
    <Router>
      <div className="flex flex-col min-h-screen bg-[#FCEBB6]">
        <header className="bg-[#5C5C5C] text-white text-center py-4 text-xl md:text-2xl font-bold">
          🍜 콩국수 사전 🍜
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
                    </div>
                  </Link>
                ))}
              </div>
            </>
          } />

          {/* 식당 상세 페이지 */}
          <Route path="/restaurant/:id" element={<RestaurantDetail restaurants={restaurants} />} />
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
        </nav>
      </div>
    </Router>
  );
}

export default App;
