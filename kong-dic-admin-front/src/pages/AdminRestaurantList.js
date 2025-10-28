// src/pages/AdminRestaurantList.js
import React, { useState, useEffect } from "react";
import axios from "axios";

const ADMIN_API_BASE_URL = process.env.REACT_APP_ADMIN_API_BASE_URL || 'http://localhost:8081';
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';

const AdminRestaurantList = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const getAuthHeader = () => {
    const token = localStorage.getItem("admin_token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const response = await axios.get(
          `${API_BASE_URL}/restaurants`,
          { headers: getAuthHeader() }
        );
        // BaseResponse 구조를 가정하여 response.data.data에서 식당 목록을 가져옴
        setRestaurants(response.data.data || []); 
      } catch (err) {
        console.error("❌ 식당 목록 불러오기 실패:", err);
        setError("식당 데이터를 불러오는 데 실패했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurants();
  }, []);
  
  // TODO: 삭제/수정 버튼 핸들러 추가
  const handleDelete = (id) => {
    if (window.confirm("정말로 이 식당을 삭제하시겠습니까?")) {
        // TODO 실제 삭제 API 호출 로직 추가 필요
        alert(`식당 ID ${id} 삭제 요청.`);
        setRestaurants(prev => prev.filter(r => r.id !== id));
    }
  };

  if (loading) {
    return <p className="text-center text-gray-600 mt-8">로딩 중...</p>;
  }

  if (error) {
    return <p className="text-center text-red-500 mt-8">❌ {error}</p>;
  }
  
  if (restaurants.length === 0) {
      return <div className="p-6 max-w-6xl mx-auto bg-gray-100 min-h-[80vh]">
        <h1 className="text-3xl font-extrabold mb-6 text-gray-800">🍽️ 등록된 식당 목록</h1>
        <div className="bg-white p-8 rounded-lg shadow-lg">
            <p className="text-center text-gray-500">현재 등록된 식당이 없습니다.</p>
        </div>
      </div>
  }

  return (
    <div className="p-6 max-w-6xl mx-auto bg-gray-100 min-h-[80vh]">
      <h1 className="text-3xl font-extrabold mb-6 text-gray-800">🍽️ 등록된 식당 목록</h1>
      
      <div className="bg-white shadow-xl rounded-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">식당 이름</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">주소</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">대표 가격</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">콩 종류</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">판매 기간</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">관리</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {restaurants.map((restaurant) => (
              <tr key={restaurant.id} className="hover:bg-yellow-50/50 transition-colors duration-150">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{restaurant.id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{restaurant.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{restaurant.address}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{restaurant.price ? `${restaurant.price.toLocaleString()}원` : 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {restaurant.beanTypes?.map(type => (
                      <span key={type} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 mr-1">
                          {type === "SOY_BEAN" ? "백태콩" : type === "BLACK_BEAN" ? "검은콩" : type}
                      </span>
                  ))}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {restaurant.servesAllYear ? '연중무휴' : `${restaurant.startMonth}~${restaurant.endMonth}월`}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex space-x-2 justify-center">
                    <button 
                        // ⭐ TODO: 수정 페이지로 이동 로직 추가
                        className="text-indigo-600 hover:text-indigo-900"
                    >
                        수정
                    </button>
                    <button 
                        onClick={() => handleDelete(restaurant.id)}
                        className="text-red-600 hover:text-red-900"
                    >
                        삭제
                    </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* TODO: 페이지네이션 및 검색/필터링 컴포넌트 추가 */}
      <div className="mt-8">
          <p className="text-sm text-gray-600">총 {restaurants.length}개의 식당이 등록되어 있습니다.</p>
      </div>
    </div>
  );
};

export default AdminRestaurantList;
