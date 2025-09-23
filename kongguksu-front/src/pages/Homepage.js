// src/pages/HomePage.js
import React, { useState, useEffect, useCallback } from "react";
import RestaurantMapAndList from "../components/RestaurantMapAndList";
import axios from "axios";

// 상수 정의 (하드코딩된 값 대신)
const INITIAL_MIN_PRICE = 5000;
const INITIAL_MAX_PRICE = 20000;

function HomePage() {
  const [filter, setFilter] = useState({
    searchTerm: "",
    beanType: "all",
    season: "all",
    minPrice: INITIAL_MIN_PRICE,
    maxPrice: INITIAL_MAX_PRICE,
  });
  const [restaurants, setRestaurants] = useState([]);
  const [location, setLocation] = useState({ latitude: null, longitude: null });
  const [loading, setLoading] = useState(true); // 로딩 상태 추가
  const [error, setError] = useState(null);   // 에러 상태 추가

  // ⭐ 식당 데이터를 서버에서 가져오는 함수 (검색 및 필터 파라미터 추가) ⭐
  // fetchRestaurants는 이제 location과 filter 상태에 의존합니다.
  const fetchRestaurants = useCallback(async () => {
    setLoading(true); // 로딩 시작
    setError(null);   // 에러 초기화

    try {
      // API 기본 URL (RestaurantController의 @RequestMapping("/api/restaurants"))
      const url = `${process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080'}/restaurants`;

      // 모든 검색 및 필터링 파라미터를 params 객체에 담기
      const params = {
        lan: location.latitude,
        lon: location.longitude,
        // Pageable 파라미터 (원하는 대로 설정)
        page: 0,
        size: 50,
        // 검색 및 필터링 조건
        searchTerm: filter.searchTerm || null,
        beanType: filter.beanType !== "all" ? filter.beanType : null,
        season: filter.season !== "all" ? filter.season : null,
        // 가격 슬라이더가 전체 범위일 경우 null로 전송
        minPrice: (filter.minPrice === INITIAL_MIN_PRICE && filter.maxPrice === INITIAL_MAX_PRICE) ? null : filter.minPrice,
        maxPrice: (filter.minPrice === INITIAL_MIN_PRICE && filter.maxPrice === INITIAL_MAX_PRICE) ? null : filter.maxPrice,
      };

      // null 또는 undefined 값은 쿼리 파라미터에서 제외
      const queryParams = Object.keys(params)
        .filter(key => params[key] !== null && params[key] !== undefined)
        .map(key => `${key}=${params[key]}`)
        .join('&');
      
      console.log("API URL:", `${url}?${queryParams}`); // 디버깅용 로그

      const response = await axios.get(`${url}?${queryParams}`);
      // BaseResponse 구조에 따라 data?.data 또는 data.data 확인
      setRestaurants(response.data?.data ?? []); 

    } catch (err) {
      console.error("식당 데이터를 불러오는 중 오류 발생:", err);
      setError("식당 목록을 불러오는 데 실패했습니다.");
    } finally {
      setLoading(false); // 로딩 종료
    }
  }, [location, filter]); // location 또는 filter 상태가 변경될 때마다 함수 재생성

  // ⭐ 위치 정보 또는 필터 상태가 변경될 때마다 API 호출 ⭐
  // 이전에는 geolocation useEffect에서만 호출했지만, 이제 filter 상태 변화에도 반응해야 합니다.
  useEffect(() => {
    // geolocation이 성공적으로 위치를 설정했거나,
    // (위치가 null이 아닐 때) 또는 위치를 가져오지 못했을 때 fetchRestaurants 호출
    if (location.latitude !== null || location.longitude !== null || !loading) {
        fetchRestaurants();
    }
  }, [location, filter, fetchRestaurants]); // fetchRestaurants는 useCallback에 의해 안정적

  // 초기 위치 정보를 가져오는 useEffect (한 번만 실행)
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLocation({ latitude, longitude });
        // fetchRestaurants는 location, filter 변화에 의해 useEffect에서 호출될 것이므로 여기서 직접 호출하지 않음
      },
      (error) => {
        console.error("위치 정보를 가져올 수 없습니다:", error);
        // 위치 정보를 가져오지 못했을 때도 필터링된 식당 목록을 가져오기 위해
        // location을 기본값으로 남겨두고 fetchRestaurants가 호출되게 합니다.
        setLocation({ latitude: 37.5665, longitude: 126.9780 }); 
      }
    );
  }, []); // 컴포넌트 마운트 시 한 번만 실행

  // 필터 변경 핸들러 (RestaurantMapAndList로 전달)
  const handleFilterChange = useCallback((type, value) => {
    setFilter((prevFilter) => ({ ...prevFilter, [type]: value }));
  }, []);

  // ⭐ HomePage에서 직접 필터링하는 로직은 이제 필요 없습니다. ⭐
  // 모든 필터링은 백엔드에서 처리됩니다.
  // filteredRestaurants 대신, 서버에서 받아온 restaurants를 직접 넘겨줍니다.

  // isCurrentlySelling 함수도 이제 백엔드에서 처리되므로 프론트엔드에서 불필요합니다.
  // function isCurrentlySelling(restaurant) { ... }


  return (
    <RestaurantMapAndList
      restaurants={restaurants} // 서버에서 받아온 최종 목록을 넘겨줍니다.
      handleFilterChange={handleFilterChange}
      filter={filter} // 모든 필터 상태를 그대로 전달
      loading={loading} // 로딩 상태 전달
      error={error}     // 에러 상태 전달
    />
  );
}

export default HomePage;