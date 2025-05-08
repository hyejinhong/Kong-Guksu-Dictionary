import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

function RestaurantDetail() {
  const { id } = useParams();
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  if (loading) return <div className="text-center mt-10">불러오는 중...</div>;
  if (error) return <div className="text-center mt-10 text-red-600">{error}</div>;
  if (!restaurant) return <div className="text-center mt-10">해당 식당을 찾을 수 없습니다.</div>;

  return (
    <div className="min-h-screen bg-[#FCEBB6] flex items-center justify-center p-6">
      <div className="bg-white w-full max-w-md rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold text-center text-[#333333] mb-2">
          {restaurant.name}
        </h1>
        <p className="text-center text-gray-600 mb-4">{restaurant.address}</p>

        <div className="space-y-3">
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
    </div>
  );
}

export default RestaurantDetail;
