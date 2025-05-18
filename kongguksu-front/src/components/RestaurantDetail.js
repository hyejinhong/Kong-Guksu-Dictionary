import { useParams } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
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

  useEffect(() => {
    const fetchRestaurant = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/restaurants/${id}`);
        setRestaurant(response.data.data);
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

    const existingScript = document.querySelector("script[src*='dapi.kakao.com']");
    if (existingScript) {
      existingScript.remove();
      delete window.kakao;
    }

    const script = document.createElement("script");
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${kakaoMapApiKey}&autoload=false&libraries=services`;
    script.async = true;
    document.head.appendChild(script);

    script.onload = () => {
      window.kakao.maps.load(() => {
        const container = mapRef.current;
        const map = new window.kakao.maps.Map(container, {
          center: new window.kakao.maps.LatLng(33.450701, 126.570667),
          level: 3,
        });

        const geocoder = new window.kakao.maps.services.Geocoder();
        geocoder.addressSearch(restaurant.address, (result, status) => {
          if (status === window.kakao.maps.services.Status.OK) {
            const coords = new window.kakao.maps.LatLng(result[0].y, result[0].x);
            new window.kakao.maps.Marker({ map, position: coords });
            map.setCenter(coords);
          }
        });
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
      await axios.post(
        `${API_BASE_URL}/restaurants/${id}/comments`,
        { content: commentContent },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      setCommentContent("");
      fetchComments();
    } catch (err) {
      alert("댓글 등록에 실패했습니다.");
    } finally {
      setCommentLoading(false);
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
              {restaurant.distance >= 0
                ? `${restaurant.distance.toFixed(2)} km`
                : "정보 없음"}
            </span>
          </div>
        </div>

        <div className="mt-6 flex justify-center">
          <button
            className="bg-[#5C5C5C] text-white px-4 py-2 rounded hover:bg-[#4a4a4a]"
            onClick={() => window.history.back()}
          >
            🔙 뒤로 가기
          </button>
        </div>
      </div>

      {/* 댓글 영역 */}
      <div className="bg-white w-full max-w-md rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4 text-[#333]">💬 댓글</h2>

        <div className="space-y-3 mb-4">
          {comments.length === 0 ? (
            <p className="text-gray-500 text-sm">댓글이 아직 없습니다.</p>
          ) : (
            comments.map((c) => (
              <div key={c.id} className="border-b pb-2">
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
    </div>
  );
}

export default RestaurantDetail;
