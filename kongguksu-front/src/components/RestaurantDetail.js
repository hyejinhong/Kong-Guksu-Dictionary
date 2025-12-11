import { useParams } from "react-router-dom";
import { useEffect, useRef, useState, useCallback } from "react"; // useCallback 추가
import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
const kakaoMapApiKey = process.env.REACT_APP_KAKAO_MAP_API_KEY;

function RestaurantDetail() {
  const { id } = useParams();
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentContent, setCommentContent] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);
  const mapRef = useRef(null);

  // ✅ '나의 사전' 관련 상태 추가
  const [showVisitModal, setShowVisitModal] = useState(false);
  const [userRating, setUserRating] = useState(0); // 사용자가 선택한 별점 (0~5)
  const [userMemo, setUserMemo] = useState(""); // 사용자가 입력한 메모
  const [isSubmittingVisit, setIsSubmittingVisit] = useState(false); // 방문 기록 저장 중 여부
  const [isSaved, setIsSaved] = useState(false);

  // JWT를 포함하는 Authorization 헤더를 반환하는 헬퍼 함수
  const getAuthHeader = useCallback(() => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  useEffect(() => {
    const fetchRestaurant = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/restaurants/${id}`, {
          headers: getAuthHeader()
        });
        setRestaurant(response.data.data);
        setIsSaved(response.data.data.isSaved);
      } catch (err) {
        setError("식당 정보를 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurant();
  }, [id]);

  useEffect(() => {
    if (!restaurant) return;

    // 카카오 맵 스크립트 중복 로드 방지 및 초기화
    const existingScript = document.querySelector("script[src*='dapi.kakao.com']");
    if (existingScript) {
      existingScript.remove();
      delete window.kakao; // 기존 kakao 객체 삭제
    }

    const script = document.createElement("script");
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${kakaoMapApiKey}&autoload=false&libraries=services`;
    script.async = true;
    document.head.appendChild(script);

    script.onload = () => {
      window.kakao.maps.load(() => {
        const container = mapRef.current;
        const map = new window.kakao.maps.Map(container, {
          center: new window.kakao.maps.LatLng(restaurant.latitude, restaurant.longitude), // 식당 위치를 중심으로
          level: 3,
        });

        const coords = new window.kakao.maps.LatLng(restaurant.latitude, restaurant.longitude);
        new window.kakao.maps.Marker({ map, position: coords });
        map.setCenter(coords);
      });
    };

    return () => {
      if (script) {
        document.head.removeChild(script);
        delete window.kakao;
      }
    };
  }, [restaurant]);


  const fetchComments = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/restaurants/${id}/comments?page=0&size=10`);
      setComments(response.data.data.content);
    } catch (err) {
      console.error("댓글을 불러오지 못했습니다", err);
    }
  };

  useEffect(() => {
    if (id) fetchComments();
  }, [id]);

  const handleCommentSubmit = async () => {
    if (!commentContent.trim()) return;

    try {
      setCommentLoading(true);
      const headers = getAuthHeader(); // JWT 헤더 사용
      await axios.post(
        `${API_BASE_URL}/restaurants/${id}/comments`,
        { content: commentContent },
        { headers }
      );
      setCommentContent("");
      fetchComments();
    } catch (err) {
      alert("댓글 등록에 실패했습니다. 로그인했는지 확인해주세요.");
    } finally {
      setCommentLoading(false);
    }
  };

  // ✅ '나의 사전' 저장 핸들러 함수
  const handleSaveVisit = async () => {
    if (!localStorage.getItem("token")) {
      alert("로그인이 필요합니다.");
      return;
    }
    if (userRating === 0) {
      alert("별점을 선택해주세요.");
      return;
    }

    setIsSubmittingVisit(true);
    try {
      const headers = getAuthHeader();
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD 형식

      const requestBody = {
        restaurantId: restaurant.id,
        visitDate: today,
        rating: userRating,
        memo: userMemo.trim() || null, // 메모가 비어있으면 null로 전송
      };

      const response = await axios.post(`${API_BASE_URL}/visited-restaurants`, requestBody, { headers });

      if (response.data.code === 0) {
        alert("식당이 나의 사전에 성공적으로 등록되었습니다!");
        setShowVisitModal(false); // 모달 닫기
        setIsSaved(true);
      } else {
        alert(`저장 실패: ${response.data.message || "알 수 없는 오류가 발생했습니다."}`);
      }
    } catch (err) {
      console.error("나의 사전 저장 실패:", err.response?.data || err.message);
      if (err.response && (err.response.status === 401 || err.response.status === 403)) {
        alert("로그인이 필요하거나 세션이 만료되었습니다.");
        localStorage.removeItem("token");
        localStorage.removeItem("exp");
        localStorage.removeItem("role");
        // navigate('/login'); // 필요하다면 로그인 페이지로 리다이렉트
      } else if (err.response && err.response.status === 409) { // 409 Conflict - 이미 저장됨
        alert("이미 나의 사전에 저장된 식당입니다.");
        setShowVisitModal(false);
      } else {
        alert(`저장 중 오류가 발생했습니다: ${err.response?.data?.message || err.message}`);
      }
    } finally {
      setIsSubmittingVisit(false);
    }
  };


  if (loading) return <div className="text-center mt-10">불러오는 중...</div>;
  if (error) return <div className="text-center mt-10 text-red-600">{error}</div>;
  if (!restaurant) return <div className="text-center mt-10">해당 식당을 찾을 수 없습니다.</div>;

  return (
    <div className="min-h-screen bg-[#FCEBB6] flex flex-col items-center p-6">
      <div className="bg-white w-full max-w-md rounded-lg shadow-lg p-6 mb-6">
        <h1 className="text-2xl font-bold text-center text-[#333333] mb-2">
          {restaurant.name}
        </h1>
        <p className="text-center text-gray-600 mb-4">{restaurant.address}</p>

        {/* 통계 정보 표시 */}
        <div className="flex justify-center items-center gap-4 mb-4 p-3 bg-yellow-50 rounded-lg">
          <div className="text-center">
            <p className="text-xs text-gray-500 font-medium">평균 별점</p>
            <div className="flex items-center justify-center text-yellow-500 font-bold text-lg">
              <span>⭐</span>
              <span className="ml-1">{restaurant.averageRating ? restaurant.averageRating.toFixed(1) : "0.0"}</span>
              <span className="text-gray-400 text-sm font-normal ml-1">/ 5.0</span>
            </div>
          </div>
          <div className="w-px h-8 bg-gray-300"></div> {/* 구분선 */}
          <div className="text-center">
            <p className="text-xs text-gray-500 font-medium">저장한 콩덕후</p>
            <div className="flex items-center justify-center font-bold text-lg text-gray-700">
              <span>👤</span>
              <span className="ml-1">{restaurant.totalScraps ? restaurant.totalScraps.toLocaleString() : "0"}</span>
              <span className="text-gray-400 text-sm font-normal ml-1">명</span>
            </div>
          </div>
        </div>

        <div ref={mapRef} className="w-full h-64 rounded mb-6" />

        <div className="space-y-3 mb-6">
          <div className="flex justify-between">
            <span className="font-medium text-gray-700">제공 기간:</span>
            <span className="text-gray-800">
              {restaurant.servesAllYear
                ? "연중무휴"
                : `${restaurant.startMonth}월 ~ ${restaurant.endMonth}월`}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="font-medium text-gray-700">콩 종류:</span>
            <span className="text-gray-800">
              {restaurant.beanTypes.join(", ")}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="font-medium text-gray-700">거리:</span>
            <span className="text-gray-800">
              {restaurant.distance != null && restaurant.distance >= 0
                ? `${restaurant.distance.toFixed(2)} km`
                : "정보 없음"}
            </span>
          </div>
          {/* 가격 정보 표시 */}
          {restaurant.prices && restaurant.prices.length > 0 && (
            <div className="flex justify-between">
              <span className="font-medium text-gray-700">가격:</span>
              <span className="text-gray-800">
                {restaurant.prices.map((bp, idx) => (
                  <span key={bp.beanType}>
                    {bp.beanType === "SOY_BEAN" ? "백태콩" : bp.beanType === "BLACK_BEAN" ? "검은콩" : bp.beanType}: {bp.price}원
                    {idx < restaurant.prices.length - 1 ? ", " : ""}
                  </span>
                ))}
              </span>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-center gap-2"> {/* 버튼들 간 간격 추가 */}
          <button
            className="bg-[#5C5C5C] text-white px-4 py-2 rounded hover:bg-[#4a4a4a]"
            onClick={() => window.history.back()}
          >
            🔙 뒤로 가기
          </button>
          {/* ✅ 나의 사전 등록 버튼 */}
          {isSaved ? (
            <button
              className="bg-gray-400 text-white px-4 py-2 rounded cursor-not-allowed"
              disabled
            >
              ✅ 나의 사전 등록됨
            </button>
          ) : (
            <button
              className="bg-[#57B4BA] text-white px-4 py-2 rounded hover:bg-[#439ca2]"
              onClick={() => {
                // 로그인 여부만 여기서 1차 확인 (모달 띄우기 전)
                if (!localStorage.getItem("token")) {
                  alert("로그인이 필요합니다.");
                  // navigate('/login'); // 필요하다면 로그인 페이지로 리다이렉트
                  return;
                }
                setShowVisitModal(true);
                setUserRating(0);
                setUserMemo("");
              }}
            >
              ⭐ 나의 사전 등록
            </button>
          )}
        </div>
      </div>

      {/* 댓글 영역 (기존과 동일) */}
      <div className="bg-white w-full max-w-md rounded-lg shadow p-6 mt-6"> {/* 상단 마진 추가 */}
        <h2 className="text-xl font-semibold mb-4 text-[#333]">💬 댓글</h2>

        <div className="space-y-3 mb-4">
          {comments.length === 0 ? (
            <p className="text-gray-500 text-sm">댓글이 아직 없습니다.</p>
          ) : (
            comments.map((c) => (
              <div key={c.id} className="border-b last:border-0 pb-2 mb-2"> {/* last:border-0 추가 */}
                <div className="text-sm font-semibold text-gray-800">{c.nickname}</div>
                <div className="text-sm text-gray-700">{c.content}</div>
                <div className="text-xs text-gray-400">
                  {new Date(c.createdAt).toLocaleString()}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="댓글을 입력하세요"
            value={commentContent}
            onChange={(e) => setCommentContent(e.target.value)}
            className="flex-1 border rounded px-3 py-2 text-sm"
          />
          <button
            onClick={handleCommentSubmit}
            className="bg-[#5C5C5C] text-white px-3 py-2 rounded text-sm hover:bg-[#4a4a4a]"
            disabled={commentLoading}
          >
            등록
          </button>
        </div>
      </div>

      {/* ✅ 나의 사전 등록 팝업 모달 */}
      {showVisitModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-sm">
            <h2 className="text-xl font-bold mb-4 text-center">나의 사전 등록</h2>

            {/* 별점 선택 */}
            <div className="mb-4 text-center">
              <span className="font-medium text-gray-700 mr-2">별점:</span>
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  className={`text-3xl cursor-pointer ${star <= userRating ? 'text-yellow-400' : 'text-gray-300'}`}
                  onClick={() => setUserRating(star)}
                >
                  ★
                </span>
              ))}
            </div>

            {/* 메모 입력 */}
            <div className="mb-6">
              <label htmlFor="userMemo" className="block text-sm font-medium text-gray-700 mb-1">메모:</label>
              <textarea
                id="userMemo"
                value={userMemo}
                onChange={(e) => setUserMemo(e.target.value)}
                className="w-full p-2 border rounded resize-none focus:ring-blue-500 focus:border-blue-500"
                rows="4"
                placeholder="간단한 메모를 남겨주세요."
              ></textarea>
            </div>

            {/* 버튼 그룹 */}
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowVisitModal(false)}
                className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400"
                disabled={isSubmittingVisit}
              >
                취소
              </button>
              <button
                onClick={handleSaveVisit}
                className="bg-[#57B4BA] text-white px-4 py-2 rounded hover:bg-[#439ca2]"
                disabled={isSubmittingVisit}
              >
                {isSubmittingVisit ? "저장 중..." : "저장"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RestaurantDetail;