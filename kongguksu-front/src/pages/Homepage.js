// src/pages/HomePage.js
import React, { useState, useEffect, useCallback } from "react"; // useCallback 추가
import RestaurantMapAndList from "../components/RestaurantMapAndList";
import axios from "axios";

function HomePage() {
  const [filter, setFilter] = useState({
    searchTerm: "", // 검색어
    beanType: "all",
    season: "all",
    minPrice: 5000, // 가격대 최소
    maxPrice: 20000, // 가격대 최대
  });
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
        fetchRestaurants(null, null);
      }
    );
  }, []);

  const fetchRestaurants = async (latitude, longitude) => {
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

  const handleFilterChange = useCallback((type, value) => {
    setFilter((prevFilter) => ({ ...prevFilter, [type]: value }));
  }, []); // filter 자체를 의존성으로 두면 무한 루프 가능성

  // 기존 필터링 로직 유지 (HomePage에서 필터링)
  const filteredRestaurants = restaurants.filter((restaurant) => {
    const isSeasonMatch = filter.season === "all" || (filter.season === "open-now" && isCurrentlySelling(restaurant)) || (filter.season === "always" && restaurant.servesAllYear);
    const isBeanTypeMatch = filter.beanType === "all" || (filter.beanType === "백태콩" && restaurant.beanTypes.includes("SOY_BEAN")) || (filter.beanType === "검은콩" && restaurant.beanTypes.includes("BLACK_BEAN"));
    
    const isSearchTermMatch = !filter.searchTerm || 
                              restaurant.name.toLowerCase().includes(filter.searchTerm.toLowerCase()) ||
                              restaurant.address.toLowerCase().includes(filter.searchTerm.toLowerCase());

    const isPriceMatch = (filter.minPrice === 5000 && filter.maxPrice === 20000) ||
                         (restaurant.price >= filter.minPrice && restaurant.price <= filter.maxPrice);

    return isSeasonMatch && isBeanTypeMatch && isSearchTermMatch && isPriceMatch;
  });

  function isCurrentlySelling(restaurant) {
    const { startMonth, endMonth, servesAllYear } = restaurant;
    const currentMonth = new Date().getMonth() + 1;
    if (servesAllYear) return true;
    if (startMonth === null || endMonth === null) return false;
    if (startMonth <= endMonth) { return currentMonth >= startMonth && currentMonth <= endMonth; }
    else { return currentMonth >= startMonth || currentMonth <= endMonth; }
  }

  return (
    <RestaurantMapAndList
      filteredRestaurants={filteredRestaurants}
      handleFilterChange={handleFilterChange}
      filter={filter} // 모든 필터 상태를 그대로 전달
    />
  );
}

export default HomePage;