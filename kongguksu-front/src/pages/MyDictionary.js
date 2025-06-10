// src/pages/MyDictionary.js
import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom"; // useNavigate 임포트 추가
// jwtDecode는 사용자 ID 추출용으로 필요하지 않다면 제거해도 무방합니다.
// 여기서는 토큰 유무 확인이 주 목적이므로 제거했습니다.

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';
const ITEMS_PER_PAGE = 10; // 한 페이지에 불러올 아이템 수

const MyDictionary = () => {
  const [visitedRestaurants, setVisitedRestaurants] = useState([]);
  const [loading, setLoading] = useState(true); // 초기 로딩 상태
  const [loadingMore, setLoadingMore] = useState(false); // 무한 스크롤 로딩 상태
  const [page, setPage] = useState(0); // 현재 페이지 번호 (0부터 시작)
  const [hasMore, setHasMore] = useState(true); // 더 불러올 데이터가 있는지 여부
  const [error, setError] = useState(null);
  const navigate = useNavigate(); // useNavigate 훅 사용

  // API 요청 시 Authorization 헤더 추가 함수
  const getAuthHeader = useCallback(() => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

    // 식당 목록 Fetch 함수 (초기 로딩 및 무한 스크롤)
  const fetchVisitedRestaurants = useCallback(async (pageNumber) => {
    // 토큰이 없는 상태에서 호출될 경우를 대비한 방어 로직 (useEffect의 return과 함께)
    const token = localStorage.getItem("token");
    if (!token) {
        setLoading(false); // 로딩 상태 종료
        return; // 토큰 없으면 API 호출 안 함
    }

    try {
      const headers = getAuthHeader();
      const url = `${API_BASE_URL}/visited-restaurants?page=${pageNumber}&size=${ITEMS_PER_PAGE}`;
      
      const response = await axios.get(url, { headers });

      if (response.data.code === 0 && Array.isArray(response.data.data)) {
        const newItems = response.data.data;
        setVisitedRestaurants(prevItems => {
          const existingIds = new Set(prevItems.map(item => item.id));
          const filteredNewItems = newItems.filter(item => !existingIds.has(item.id));
          return [...prevItems, ...filteredNewItems];
        });
        setHasMore(newItems.length === ITEMS_PER_PAGE); 
      } else {
        setError(response.data.message || "데이터를 불러오는데 실패했습니다.");
        setHasMore(false);
      }
    } catch (err) {
      console.error("나의 사전 불러오기 실패:", err.response?.data || err.message);
      // 인증 오류 (401, 403) 발생 시 로그인 페이지로 리다이렉트 (선택 사항)
      if (err.response && (err.response.status === 401 || err.response.status === 403)) {
        alert("로그인이 필요하거나 세션이 만료되었습니다.");
        localStorage.removeItem("token");
        localStorage.removeItem("exp");
        localStorage.removeItem("role");
        navigate('/login');
      } else {
        setError(err.response?.data?.message || "나의 사전 데이터를 불러오는데 실패했습니다.");
      }
      setHasMore(false);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [getAuthHeader, navigate]); // navigate를 의존성 배열에 추가

  // 컴포넌트 마운트 시 토큰 유무 확인 및 리다이렉트
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      // 토큰이 없으면 로그인 페이지로 리다이렉트
      navigate('/login');
      // 이후의 fetch 로직이 실행되지 않도록 여기서 리턴
      return; 
    }
    // 토큰이 있으면 기존 fetch 로직 진행
    setLoading(true);
    setPage(0);
    setHasMore(true);
    setVisitedRestaurants([]);
    fetchVisitedRestaurants(0);
  }, [fetchVisitedRestaurants, navigate]); // navigate를 의존성 배열에 추가

  // 무한 스크롤 핸들러 (기존과 동일)
  const handleScroll = useCallback(() => {
    if (
      window.innerHeight + window.scrollY >= document.body.offsetHeight - 200 &&
      !loadingMore &&
      hasMore
    ) {
      setLoadingMore(true);
      setPage(prevPage => prevPage + 1);
    }
  }, [loadingMore, hasMore]);

  // 페이지 상태 변경 시 추가 데이터 로드 (기존과 동일)
  useEffect(() => {
    if (page > 0 && hasMore) {
      fetchVisitedRestaurants(page);
    }
  }, [page, hasMore, fetchVisitedRestaurants]);

  // 스크롤 이벤트 리스너 등록 및 해제 (기존과 동일)
  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  // -------------------- 렌더링 부분 --------------------

  if (loading) {
    return <p className="text-center text-gray-600 mt-8">나의 사전 로딩 중...</p>;
  }

  if (error) {
    return <p className="text-center text-red-500 mt-8">오류: {error}</p>;
  }

  if (visitedRestaurants.length === 0 && !loading && !hasMore) {
    return (
      <div className="p-6 bg-[#FCEBB6] min-h-screen text-center text-gray-600">
        <h1 className="text-2xl font-bold mb-4 text-[#5C5C5C]">📌 나의 사전</h1>
        <p>아직 나의 사전에 저장된 콩국수 식당이 없습니다.</p>
        <Link to="/" className="text-blue-500 hover:underline mt-2 inline-block">
          지금 식당 찾아보기
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 bg-[#FCEBB6] min-h-screen">
      <h1 className="text-2xl font-bold mb-4 text-center text-[#5C5C5C]">📌 나의 사전</h1>

      <div className="max-w-4xl mx-auto">
        {visitedRestaurants.map((visit) => (
          <Link key={visit.id} to={`/restaurant/${visit.restaurant.id}`} className="block">
            <div className="bg-white p-4 mb-3 rounded-lg shadow-md relative">
              <p className="font-bold text-lg">{visit.restaurant.name}</p>
              <p className="text-sm text-gray-600">{visit.restaurant.address}</p>
              
              {visit.restaurant.distance != null && visit.restaurant.distance !== -1 && (
                <p className="text-sm">거리: {visit.restaurant.distance?.toFixed(1)}km</p>
              )}

              <p className="text-sm mt-1">
                콩 종류:{" "}
                {visit.restaurant.beanTypes && visit.restaurant.beanTypes.length > 0 ? (
                  visit.restaurant.beanTypes.map((type, index) => (
                    <span key={type}>
                      {type === "SOY_BEAN" ? "백태콩" : type === "BLACK_BEAN" ? "검은콩" : type}
                      {index < visit.restaurant.beanTypes.length - 1 ? ", " : ""}
                    </span>
                  ))
                ) : (
                  <span>정보 없음</span>
                )}
              </p>
              <p className="text-sm">
                판매 기간:{" "}
                {visit.restaurant.servesAllYear
                  ? "사계절 판매"
                  : visit.restaurant.startMonth && visit.restaurant.endMonth
                    ? `${visit.restaurant.startMonth}월 ~ ${visit.restaurant.endMonth}월`
                    : "정보 없음"}
              </p>
              {visit.restaurant.prices && visit.restaurant.prices.length > 0 && (
                <p className="text-sm">
                  가격:{" "}
                  {visit.restaurant.prices.map((bp, idx) => (
                    <span key={bp.beanType}>
                      {bp.beanType === "SOY_BEAN" ? "백태콩" : bp.beanType === "BLACK_BEAN" ? "검은콩" : bp.beanType}: {bp.price}원
                      {idx < visit.restaurant.prices.length - 1 ? ", " : ""}
                    </span>
                  ))}
                </p>
              )}

              <div className="mt-2 text-sm text-gray-700 border-t border-gray-200 pt-2">
                {visit.visitDate && <p>방문일: {visit.visitDate}</p>}
                {visit.rating != null && (
                  <p>별점: {"⭐".repeat(visit.rating) + "☆".repeat(5 - visit.rating)}</p>
                )}
                {visit.memo && <p>메모: {visit.memo}</p>}
              </div>
            </div>
          </Link>
        ))}

        {loadingMore && <p className="text-center text-gray-600 my-4">더 불러오는 중...</p>}
        {!hasMore && visitedRestaurants.length > 0 && !loading && (
          <p className="text-center text-gray-600 my-4">모든 식당을 불러왔습니다.</p>
        )}
      </div>
    </div>
  );
};

export default MyDictionary;