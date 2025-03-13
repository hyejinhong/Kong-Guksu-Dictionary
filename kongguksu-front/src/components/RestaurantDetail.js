import { useParams } from "react-router-dom";

function RestaurantDetail({ restaurants }) {
  const { id } = useParams(); // URL의 id 값을 가져옴
  const restaurant = restaurants.find((r, index) => index.toString() === id);

  if (!restaurant) {
    return <div className="text-center mt-10">해당 식당을 찾을 수 없습니다.</div>;
  }

  return (
    <div className="min-h-screen bg-[#FCEBB6] p-6">
      <h1 className="text-2xl font-bold text-center">{restaurant.name}</h1>
      <p className="text-center text-gray-600">{restaurant.distance}</p>
      <p className="text-center text-gray-600">{restaurant.type}</p>

      {/* 네비게이션 버튼 */}
      <div className="flex justify-center mt-4">
        <button 
          className="bg-[#5C5C5C] text-white px-4 py-2 rounded"
          onClick={() => window.history.back()}
        >
          🔙 뒤로 가기
        </button>
      </div>
    </div>
  );
}

export default RestaurantDetail;
