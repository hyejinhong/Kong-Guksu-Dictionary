import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Route, Routes, Link } from "react-router-dom";
import "./index.css";
import KakaoMap from "./components/KakaoMap";
import RestaurantDetail from "./components/RestaurantDetail";
import RestaurantSubmissionForm from "./components/RestaurantSubmissionForm";
import AdminRestaurantSubmissions from "./pages/AdminRestaurantSubmissions";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import axios from "axios";

function App() {
  const [filter, setFilter] = useState({ season: "all", beanType: "all" });
  const [restaurants, setRestaurants] = useState([]);
  const [location, setLocation] = useState({ latitude: null, longitude: null });

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLocation({ latitude, longitude });
        fetchRestaurants(latitude, longitude);
      },
      (error) => {
        console.error("위치 정보를 가져올 수 없습니다:", error);
      }
    );
  }, []);

  const fetchRestaurants = async (latitude, longitude) => {
    try {
      const response = await axios.get("http://localhost:8080/restaurants/nearby", {
        params: {
          latitude,
          longitude,
          distance: 5,
          page: 0,
          size: 50,
        },
      });

      const data = response.data?.data ?? [];
      setRestaurants(data);
    } catch (error) {
      console.error("식당 데이터를 불러오는 중 오류 발생:", error);
    }
  };

  const handleFilterChange = (type, value) => {
    setFilter((prevFilter) => ({ ...prevFilter, [type]: value }));
  };

  const filteredRestaurants = restaurants.filter((restaurant) => {
    const currentMonth = new Date().getMonth() + 1;

    const isSeasonMatch =
      filter.season === "all" ||
      (filter.season === "open-now" && isCurrentlySelling(restaurant));

    const isBeanTypeMatch =
      filter.beanType === "all" ||
      (filter.beanType === "백태콩" && restaurant.beanTypes.includes("SOY_BEAN")) ||
      (filter.beanType === "검은콩" && restaurant.beanTypes.includes("BLACK_BEAN"));

    return isSeasonMatch && isBeanTypeMatch;
  });

  function isCurrentlySelling(restaurant) {
    const { startMonth, endMonth, servesAllYear } = restaurant;
    const currentMonth = new Date().getMonth() + 1;

    if (servesAllYear) return true;

    if (startMonth <= endMonth) {
      return startMonth <= currentMonth && currentMonth <= endMonth;
    } else {
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
          <Link to="/login" className="bg-[#57B4BA] text-white px-3 py-1 rounded-md text-sm">
            로그인
          </Link>
        </header>

        <Routes>
          <Route path="/" element={
            <>
              <div className="flex justify-center my-4">
                <KakaoMap restaurants={filteredRestaurants} />
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
                  <Link key={restaurant.id} to={`/restaurant/${restaurant.id}`} className="block">
                    <div className="bg-white p-4 mb-2 rounded-lg shadow-md">
                      <p className="font-bold text-lg">{restaurant.name}</p>
                      <p className="text-sm text-gray-600">{restaurant.address}</p>
                      <p className="text-sm">
                        거리: {restaurant.distance?.toFixed(1)}km
                      </p>
                      <p className="text-sm">
                        콩 종류: {restaurant.beanTypes.includes("SOY_BEAN") && "백태콩 "}
                        {restaurant.beanTypes.includes("BLACK_BEAN") && "검은콩"}
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
