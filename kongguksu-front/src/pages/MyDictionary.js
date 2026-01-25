// src/pages/MyDictionary.js
import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import VisitModal from "../components/VisitModal";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';
const ITEMS_PER_PAGE = 10;

const MyDictionary = () => {
  const [visitedRestaurants, setVisitedRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);
  const [editingVisit, setEditingVisit] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const navigate = useNavigate();

  const getAuthHeader = useCallback(() => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  // 식당 목록 Fetch 함수
  const fetchVisitedRestaurants = useCallback(async (pageNumber) => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
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
  }, [getAuthHeader, navigate]);

  // 삭제 핸들러 함수 추가
  const handleDeleteVisit = useCallback(async (visitId, restaurantName) => {
    if (window.confirm(`"${restaurantName}" 식당을 나의 사전에서 삭제할까요?`)) {
      try {
        const headers = getAuthHeader();
        const url = `${API_BASE_URL}/visited-restaurants/${visitId}`; // API 엔드포인트: /visited-restaurants/{id}

        const response = await axios.delete(url, { headers });

        if (response.data.code === 0) {
          alert(`"${restaurantName}" 식당이 나의 사전에서 삭제되었습니다.`);
          // 삭제 성공 시, 목록에서 해당 아이템 제거
          setVisitedRestaurants(prevItems => prevItems.filter(item => item.id !== visitId));
          // 만약 현재 페이지의 아이템 수가 줄어들었다면, 다음 페이지를 미리 불러오는 로직을 고려할 수도 있습니다.
          // (복잡해지므로 여기서는 생략)
        } else {
          alert(`삭제 실패: ${response.data.message || "알 수 없는 오류가 발생했습니다."}`);
        }
      } catch (err) {
        console.error("나의 사전 식당 삭제 실패:", err.response?.data || err.message);
        // 인증 오류 (401, 403) 발생 시 로그인 페이지로 리다이렉트
        if (err.response && (err.response.status === 401 || err.response.status === 403)) {
          alert("로그인이 필요하거나 세션이 만료되었습니다.");
          localStorage.removeItem("token");
          localStorage.removeItem("exp");
          localStorage.removeItem("role");
          navigate('/login');
        } else {
          alert(`삭제 중 오류가 발생했습니다: ${err.response?.data?.message || err.message}`);
        }
      }
    }
  }, [getAuthHeader, navigate]);


  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    setLoading(true);
    setPage(0);
    setHasMore(true);
    setVisitedRestaurants([]);
    fetchVisitedRestaurants(0);
  }, [fetchVisitedRestaurants, navigate]);

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

  useEffect(() => {
    if (page > 0 && hasMore) {
      fetchVisitedRestaurants(page);
    }
  }, [page, hasMore, fetchVisitedRestaurants]);

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
          // Link 컴포넌트 내부에서 onClick을 사용하면 라우팅과 클릭 이벤트가 동시에 발생할 수 있으므로
          // 삭제 버튼은 Link 바깥 또는 Link의 이벤트 버블링을 막도록 구현하는 것이 좋습니다.
          // 여기서는 Link를 감싸는 div 안에 버튼을 배치하고 이벤트 버블링을 막습니다.
          <div key={visit.id} className="bg-white p-4 mb-3 rounded-lg shadow-md relative">
            {/* 삭제 버튼 */}
            <button
              onClick={(e) => {
                e.preventDefault(); // Link 태그로의 이동 방지
                e.stopPropagation(); // 이벤트 버블링 방지
                handleDeleteVisit(visit.id, visit.restaurant.name);
              }}
              className="absolute top-2 right-2 text-gray-500 hover:text-red-500 text-lg font-bold"
              aria-label="식당 삭제"
            >
              &times; {/* HTML 엔티티로 'x' 표시 */}
            </button>

            {/* 수정 버튼 */}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setEditingVisit(visit); // 수정 대상 설정
                setShowModal(true);     // 모달 열기
              }}
              className="absolute top-2 right-10 text-gray-500 hover:text-blue-500 text-lg font-bold"
              aria-label="수정"
            >
              ✏️
            </button>

            {/* 나머지 내용은 Link로 감싸서 상세 페이지 이동 */}
            <Link to={`/restaurant/${visit.restaurant.id}`} className="block">
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
                {visit.visitedDate && <p>방문일: {visit.visitedDate}</p>}
                {visit.rating != null && (
                  <p>별점: {"⭐".repeat(visit.rating) + "☆".repeat(5 - visit.rating)}</p>
                )}
                {visit.memo && <p>메모: {visit.memo}</p>}
              </div>
            </Link>
          </div>
        ))}

        {loadingMore && <p className="text-center text-gray-600 my-4">더 불러오는 중...</p>}
        {!hasMore && visitedRestaurants.length > 0 && !loading && (
          <p className="text-center text-gray-600 my-4">모든 식당을 불러왔습니다.</p>
        )}
      </div>
            {showModal && editingVisit && (
        <VisitModal
          editingVisit={editingVisit}
          onChange={setEditingVisit}
          onClose={() => setShowModal(false)}
          onSave={async () => {
            try {
              const headers = getAuthHeader();
              const url = `${API_BASE_URL}/visited-restaurants/${editingVisit.id}`;
              const payload = {
                visitedDate: editingVisit.visitedDate,
                rating: editingVisit.rating,
                memo: editingVisit.memo,
              };
              const response = await axios.patch(url, payload, { headers });
              
              if (response.data.code === 0) {
                alert("수정이 완료되었습니다.");
                // 목록 업데이트
                setVisitedRestaurants(prev =>
                  prev.map(v => (v.id === editingVisit.id ? editingVisit : v))
                );
                setShowModal(false);
              } else {
                alert("수정 실패: " + response.data.message);
              }
            } catch (err) {
              alert("수정 중 오류 발생: " + err.message);
            }
          }}
        />
      )}
    </div>
  );
};


export default MyDictionary;