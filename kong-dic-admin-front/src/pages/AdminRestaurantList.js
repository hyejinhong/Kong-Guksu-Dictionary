import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

const ITEMS_PER_PAGE = 10;
const ADMIN_API_BASE_URL = process.env.REACT_APP_ADMIN_API_BASE_URL || 'http://localhost:8081';
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';

const AdminRestaurantList = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  // 모달 관련 상태
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [targetIdToDelete, setTargetIdToDelete] = useState(null);
  const [targetNameToDelete, setTargetNameToDelete] = useState('');

  const getAuthHeader = () => {
    const token = localStorage.getItem("admin_token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchRestaurants = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        size: ITEMS_PER_PAGE,
        // TODO: 검색 및 필터링 파라미터도 여기에 추가해야 합니다.
      };

      const response = await axios.get(
        `${API_BASE_URL}/restaurants`, // ⭐ 메인 백엔드의 API를 사용한다고 가정
        { params, headers: getAuthHeader() }
      );

      const pageData = response.data?.data;

      if (pageData && pageData.content) {
        setRestaurants(pageData.content);
        setTotalPages(pageData.totalPages || 1);
        setTotalElements(pageData.totalElements || 0);
      } else {
        setRestaurants([]);
        setTotalPages(1);
        setTotalElements(0);
      }

    } catch (err) {
      console.error("❌ 식당 목록 불러오기 실패:", err);
      setError("식당 데이터를 불러오는 데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }, [currentPage]);

  useEffect(() => {
    fetchRestaurants();
  }, [fetchRestaurants]);

  // 삭제
  const executeDelete = async (id) => {
    try {
      await axios.delete(
        `${API_BASE_URL}/restaurants/${id}`, // 어드민 백엔드 경로 호출
        { headers: getAuthHeader() }
      );

      setModalMessage(`식당 ID ${id} "${targetNameToDelete}"이(가) 성공적으로 삭제되었습니다.`);
      setIsAlertModalOpen(true);

      fetchRestaurants(); // 목록 새로고침

    } catch (error) {
      console.error("❌ 삭제 실패:", error);
      const status = error.response?.status;
      let message = "삭제 처리 중 오류가 발생했습니다. 권한을 확인하거나 서버 로그를 확인하세요.";
      if (status === 403) {
        message = "삭제 권한이 없습니다. (403 Forbidden)";
      }
      setModalMessage(message);
      setIsAlertModalOpen(true);
    } finally {
      // 삭제 처리 후 상태 초기화
      setTargetIdToDelete(null);
      setTargetNameToDelete('');
      setIsConfirmModalOpen(false); // 확인 모달 닫기
    }
  };

  // 삭제 버튼 클릭 시, 확인 모달 열기
  const handleDelete = (id) => {
    const restaurantName = restaurants.find(r => r.id === id)?.name;

    setTargetIdToDelete(id);
    setTargetNameToDelete(restaurantName);
    setModalMessage(`식당 ID ${id} "${restaurantName}"을(를) 정말로 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`);
    setIsConfirmModalOpen(true); // 확인 모달 열기
  };

  // 확인 모달에서 '삭제' 버튼 클릭 시 실행
  const handleConfirmDelete = () => {
    if (targetIdToDelete) {
      executeDelete(targetIdToDelete);
    }
  };

  // 알림 모달 닫기
  const handleAlertClose = () => {
    setIsAlertModalOpen(false);
    setModalMessage('');
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 0 && newPage < totalPages) {
      setCurrentPage(newPage);
    }
  };

  const startItem = totalElements > 0 ? ITEMS_PER_PAGE * currentPage + 1 : 0;
  const endItem = Math.min(startItem + ITEMS_PER_PAGE - 1, totalElements);


  if (loading) {
    return <p className="text-center text-gray-600 mt-8">로딩 중...</p>;
  }

  if (error) {
    return <p className="text-center text-red-500 mt-8">❌ {error}</p>;
  }

  if (restaurants.length === 0 && currentPage === 0 && !loading) {
    return <div className="p-6 max-w-6xl mx-auto bg-gray-100 min-h-[80vh]">
      <h1 className="text-3xl font-extrabold mb-6 text-gray-800">🍽️ 등록된 식당 목록</h1>
      <div className="bg-white p-8 rounded-lg shadow-lg">
        <p className="text-center text-gray-500">현재 등록된 식당이 없습니다.</p>
      </div>
    </div>
  }

  // 페이지네이션 후 빈 페이지 처리
  if (restaurants.length === 0 && currentPage > 0) {
    setCurrentPage(prev => prev - 1);
    return <p className="text-center text-gray-600 mt-8">데이터가 없어 이전 페이지로 이동합니다...</p>;
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
                  {restaurant.servesAllYear ? '연중무휴' : (restaurant.startMonth > 0 && restaurant.endMonth > 0 ? `${restaurant.startMonth}~${restaurant.endMonth}월` : '')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex space-x-2 justify-center">
                  <Link
                    to={`/restaurants/edit/${restaurant.id}`}
                    className="text-indigo-600 hover:text-indigo-900"
                  >
                    수정
                  </Link>
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

      {/* 페이지네이션 UI */}
      <div className="flex justify-between items-center mt-6">
        <p className="text-sm text-gray-600">총 {totalElements}개 중 {totalElements > 0 ? `${startItem} - ${endItem}` : '0'}개 표시</p>
        <div className="flex space-x-2">
          <button
            className="px-4 py-2 rounded-lg font-semibold transition-colors duration-200 bg-gray-700 text-white disabled:bg-gray-300 disabled:text-gray-600"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 0}
          >
            ◀ 이전
          </button>

          <span className="px-4 py-2 bg-white shadow-md rounded-lg text-gray-800 font-semibold">
            {currentPage + 1} / {totalPages}
          </span>

          <button
            className="px-4 py-2 rounded-lg font-semibold transition-colors duration-200 bg-gray-700 text-white disabled:bg-gray-300 disabled:text-gray-600"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage + 1 === totalPages || totalPages === 0}
          >
            다음 ▶
          </button>
        </div>
      </div>

      {/* Confirmation Modal UI (삭제 확인) */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 transition-opacity">
          <div className="bg-white p-6 rounded-xl shadow-2xl max-w-sm w-full transform transition-all">
            <h3 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">삭제 확인</h3>
            <p className="text-gray-700 mb-6">{modalMessage}</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setIsConfirmModalOpen(false)}
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 font-medium transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors shadow-md"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Alert Modal UI (삭제 결과 알림) */}
      {isAlertModalOpen && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 transition-opacity">
          <div className="bg-white p-6 rounded-xl shadow-2xl max-w-sm w-full transform transition-all">
            <h3 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">알림</h3>
            <p className="text-gray-700 mb-6">{modalMessage}</p>
            <div className="flex justify-end">
              <button
                onClick={handleAlertClose}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors shadow-md"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminRestaurantList;
