// src/pages/HomePage.js
import React, { useState, useEffect, useCallback } from "react";
import RestaurantMapAndList from "../components/RestaurantMapAndList";
import axios from "axios";
import { Link } from "react-router-dom";

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
  const [loading, setLoading] = useState(true); // 로딩 상태
  const [error, setError] = useState(null);   // 에러 상태
  const [rankings, setRankings] = useState([]); // 랭킹 상태

  // 식당 데이터를 서버에서 가져오는 함수
  const fetchRestaurants = useCallback(async () => {
    setLoading(true); // 로딩 시작
    setError(null);   // 에러 초기화

    try {
      const url = `${process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080'}/restaurants/filter`;

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

  // 실시간 랭킹 데이터 가져오기 (마운트 시 1회 호출)
  useEffect(() => {
    const fetchRankings = async () => {
      try {
        const url = `${process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080'}/restaurants/ranking`;
        const response = await axios.get(url);
        if (response.data && response.data.code === 0) {
            setRankings(response.data.data || []);
        }
      } catch (err) {
        console.error("랭킹 데이터를 불러오는 중 오류 발생:", err);
      }
    };
    
    fetchRankings();
  }, []);

  return (
    // 전체 화면을 좌우로 나누는 Flex 컨테이너 (모바일에서는 세로 배치)
    <div className="flex flex-col lg:flex-row min-h-[calc(100vh-64px)] w-full">
      
      {/* 1. 메인 영역 (지도 및 리스트) */}
      <div className="flex-1 w-full lg:w-auto relative">
        <RestaurantMapAndList
          restaurants={restaurants}
          handleFilterChange={handleFilterChange}
          filter={filter}
          loading={loading}
          error={error}
        />
      </div>

      {/* 2. 랭킹 사이드바 영역 */}
      <div className="w-full lg:w-80 bg-white border-l border-gray-200 shadow-sm z-10 overflow-y-auto">
        <div className="p-5">
          <h2 className="text-xl font-bold text-gray-800 mb-5 flex items-center gap-2">
            <span>🔥</span> 지금 뜨는 콩국수 TOP 10
          </h2>
          
          <div className="space-y-3">
            {rankings.length === 0 ? (
              <p className="text-center text-gray-500 py-10 text-sm bg-gray-50 rounded-lg">
                아직 랭킹 데이터가 없습니다.<br/>첫 조회의 주인공이 되어보세요!
              </p>
            ) : (
              rankings.map((shop) => (
                <Link 
                  key={shop.id} 
                  to={`/restaurant/${shop.id}`}
                  className="flex items-center gap-4 p-3 rounded-xl hover:bg-yellow-50 border border-transparent hover:border-yellow-200 transition-all cursor-pointer group"
                >
                  {/* 순위 아이콘 (1, 2, 3위는 색상 강조) */}
                  <div className={`flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full font-bold text-sm shadow-sm
                    ${shop.rank === 1 ? 'bg-yellow-400 text-white' : 
                      shop.rank === 2 ? 'bg-gray-300 text-gray-700' : 
                      shop.rank === 3 ? 'bg-amber-600 text-white' : 
                      'bg-gray-100 text-gray-500 group-hover:bg-white'}
                  `}>
                    {shop.rank}
                  </div>

                  {/* 식당 간략 정보 */}
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-900 font-semibold truncate group-hover:text-yellow-700 transition-colors">
                      {shop.name}
                    </p>
                    <div className="flex items-center text-xs text-gray-500 mt-0.5 gap-2">
                      <span className="flex items-center text-yellow-500 font-medium">
                        ⭐ {shop.averageRating ? shop.averageRating.toFixed(1) : "0.0"}
                      </span>
                      <span className="truncate text-gray-400">
                        {/* 주소에서 '서울 강남구' 정도까지만 잘라서 보여줌 */}
                        {shop.address ? shop.address.split(' ').slice(0, 2).join(' ') : ""}
                      </span>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>

    </div>
    
  );
}

export default HomePage;