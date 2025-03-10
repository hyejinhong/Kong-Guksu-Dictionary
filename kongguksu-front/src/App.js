import React, { useState } from "react";
import "./App.css";

// 임시 데이터
const restaurants = [
  { name: "맛집 A", distance: "500m", type: "백태콩" },
  { name: "맛집 B", distance: "1km", type: "검은콩" },
  { name: "맛집 C", distance: "300m", type: "백태콩" },
];

function App() {
  const [filter, setFilter] = useState({
    season: "all",
    beanType: "all",
  });

  const handleFilterChange = (type, value) => {
    setFilter((prevFilter) => ({
      ...prevFilter,
      [type]: value,
    }));
  };

  // 필터된 식당 리스트
  const filteredRestaurants = restaurants.filter((restaurant) => {
    return (
      (filter.season === "all" || filter.season === "year-round") &&
      (filter.beanType === "all" || restaurant.type === filter.beanType)
    );
  });

  return (
    <div className="App">
      <header className="App-header">
        <h1>콩국수 사전</h1>
        <div className="search">
          <button>🔍 위치 검색</button>
        </div>
      </header>

      {/* 네비게이션 바 */}
      <nav className="App-nav">
        <button>🏠 홈</button>
        <button>📌 찜한 식당</button>
        <button>💬 커뮤니티</button>
        <button>⚙ 설정</button>
      </nav>

      <main>
        {/* 지도 표시 */}
        <div className="map-container">
          <div className="map">🗺 지도</div>
        </div>

        {/* 필터 */}
        <div className="filters">
          <div>
            <label>연중 상시</label>
            <input
              type="radio"
              name="season"
              value="year-round"
              onChange={() => handleFilterChange("season", "year-round")}
            />
          </div>
          <div>
            <label>특정 기간</label>
            <input
              type="radio"
              name="season"
              value="seasonal"
              onChange={() => handleFilterChange("season", "seasonal")}
            />
          </div>

          <div>
            <label>백태콩</label>
            <input
              type="radio"
              name="beanType"
              value="백태콩"
              onChange={() => handleFilterChange("beanType", "백태콩")}
            />
          </div>
          <div>
            <label>검은콩</label>
            <input
              type="radio"
              name="beanType"
              value="검은콩"
              onChange={() => handleFilterChange("beanType", "검은콩")}
            />
          </div>
        </div>

        {/* 추천 식당 리스트 */}
        <div className="restaurant-list">
          {filteredRestaurants.map((restaurant, index) => (
            <div key={index} className="restaurant-item">
              <p>{restaurant.name}</p>
              <p>{restaurant.distance}</p>
              <p>{restaurant.type}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

export default App;
