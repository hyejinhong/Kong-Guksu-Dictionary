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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 랭킹 및 탭 관련 상태
  const [rankingData, setRankingData] = useState([]);
  const [activeTab, setActiveTab] = useState('views'); // 'views' | 'rating'
  const [isLoading, setIsLoading] = useState(false);

  // 식당 데이터를 서버에서 가져오는 함수
  const fetchRestaurants = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const url = `${process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080'}/restaurants/filter`;

      const params = {
        lan: location.latitude,
        lon: location.longitude,
        page: 0,
        size: 50,
        searchTerm: filter.searchTerm || null,
        beanType: filter.beanType !== "all" ? filter.beanType : null,
        season: filter.season !== "all" ? filter.season : null,
        minPrice: (filter.minPrice === INITIAL_MIN_PRICE && filter.maxPrice === INITIAL_MAX_PRICE) ? null : filter.minPrice,
        maxPrice: (filter.minPrice === INITIAL_MIN_PRICE && filter.maxPrice === INITIAL_MAX_PRICE) ? null : filter.maxPrice,
      };

      const queryParams = Object.keys(params)
        .filter(key => params[key] !== null && params[key] !== undefined)
        .map(key => `${key}=${params[key]}`)
        .join('&');
      
      const response = await axios.get(`${url}?${queryParams}`);
      setRestaurants(response.data?.data ?? []); 

    } catch (err) {
      console.error("식당 데이터를 불러오는 중 오류 발생:", err);
      setError("식당 목록을 불러오는 데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }, [location, filter]);

  // 위치 정보 또는 필터 상태가 변경될 때만 API 호출
  useEffect(() => {
    if (location.latitude !== null || location.longitude !== null) {
        fetchRestaurants();
    }
  }, [location.latitude, location.longitude, filter, fetchRestaurants]); 

  // 초기 위치 정보를 가져오는 useEffect
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLocation({ latitude, longitude });
      },
      (error) => {
        console.error("위치 정보를 가져올 수 없습니다:", error);
        setLocation({ latitude: 37.5665, longitude: 126.9780 }); 
      }
    );
  }, []);

  const handleFilterChange = useCallback((type, value) => {
    setFilter((prevFilter) => ({ ...prevFilter, [type]: value }));
  }, []);

  // 실시간 랭킹 데이터 가져오기 (activeTab 바뀔 때마다 실행)
  const fetchRanking = async () => {
    setIsLoading(true);
    try {
      const endpoint = activeTab === 'views' 
        ? '/restaurants/ranking' 
        : '/restaurants/ranking/rating';
        
      const response = await axios.get(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080'}${endpoint}`);
      
      if (response.data && response.data.data) {
        setRankingData(response.data.data);
      }
    } catch (error) {
      console.error('랭킹 데이터를 불러오는데 실패했습니다.', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRanking();
  }, [activeTab]);


  return (
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
      <div className="w-full lg:w-80 bg-white border-l border-gray-200 shadow-sm z-10 flex flex-col">
        
        {/* 사이드바 헤더 */}
        <div className="p-5 pb-3 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <span>🏆</span> 실시간 콩국수 랭킹
          </h2>
          <p className="text-sm text-gray-500 mt-1">지금 가장 핫한 콩국수 맛집은?</p>
        </div>

        {/* 탭 UI 영역 */}
        <div className="px-5 py-3 flex space-x-2 border-b border-gray-200 bg-gray-50">
          <button
            onClick={() => setActiveTab('views')}
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${
              activeTab === 'views'
                ? 'bg-yellow-500 text-white shadow-md'
                : 'bg-white text-gray-500 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            🔥 인기순
          </button>
          <button
            onClick={() => setActiveTab('rating')}
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${
              activeTab === 'rating'
                ? 'bg-yellow-500 text-white shadow-md'
                : 'bg-white text-gray-500 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            ⭐ 별점순
          </button>
        </div>

        {/* 랭킹 리스트 렌더링 영역 */}
        <div className="flex-1 overflow-y-auto p-5">
          <div className="space-y-3">
            {isLoading ? (
              <p className="text-center text-gray-500 py-10 text-sm font-medium animate-pulse">
                데이터를 불러오는 중입니다...
              </p>
            ) : rankingData.length === 0 ? (
              <p className="text-center text-gray-500 py-10 text-sm bg-gray-50 rounded-lg">
                아직 랭킹 데이터가 없습니다.<br/>첫 조회의 주인공이 되어보세요!
              </p>
            ) : (
              rankingData.map((shop, index) => (
                <Link 
                  key={shop.id || index} 
                  to={`/restaurant/${shop.id}`}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-yellow-50 border border-transparent hover:border-yellow-200 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-4 overflow-hidden">
                    {/* 순위 아이콘 */}
                    <div className={`flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full font-bold text-sm shadow-sm
                      ${index === 0 ? 'bg-yellow-400 text-white' : 
                        index === 1 ? 'bg-gray-300 text-gray-700' : 
                        index === 2 ? 'bg-amber-600 text-white' : 
                        'bg-gray-100 text-gray-500 group-hover:bg-white'}
                    `}>
                      {shop.rank || index + 1}
                    </div>

                    {/* 식당 간략 정보 */}
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-900 font-semibold truncate group-hover:text-yellow-700 transition-colors">
                        {shop.name}
                      </p>
                      <div className="flex items-center text-xs text-gray-500 mt-0.5 gap-2">
                        <span className="truncate text-gray-400">
                          {shop.address ? shop.address.split(' ').slice(0, 2).join(' ') : ""}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* ⭐ 탭에 따라 우측에 보여줄 수치 다르게 설정 */}
                  <div className="text-sm font-bold text-gray-600 ml-2 whitespace-nowrap">
                    {activeTab === 'views' ? (
                      <span className="flex items-center gap-1">
                        <span className="text-gray-400 text-xs font-normal">조회</span>
                        {/* 백엔드 DTO명(reviewCount, totalScraps 등)에 맞게 렌더링 */}
                        {shop.reviewCount ?? shop.totalScraps ?? 0}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-yellow-500">
                        ⭐ {shop.averageRating ? shop.averageRating.toFixed(1) : "0.0"}
                      </span>
                    )}
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