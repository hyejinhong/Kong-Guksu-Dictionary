import React, { useState, useEffect } from "react";
import axios from "axios";

const AdminRestaurantSubmissions = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 3;

  const ADMIN_API_BASE_URL = process.env.REACT_APP_ADMIN_API_BASE_URL || 'http://localhost:8080';

  const getAuthHeader = () => {
    const token = localStorage.getItem("admin_token"); 
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        const response = await axios.get(
          `${ADMIN_API_BASE_URL}/admin/restaurants/submissions`, 
          { headers: getAuthHeader() }
        );
        
        setSubmissions(response.data?.data || []);
      } catch (error) {
        console.error("❌ 데이터 불러오기 실패:", error);
        alert("데이터를 불러오는 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissions();
  }, []);

  const handleApprove = async (submissionId) => {
    try {
      const response = await axios.patch(
        `${ADMIN_API_BASE_URL}/admin/restaurants/submissions/${submissionId}/approve`, 
        {},
        { headers: getAuthHeader() }
      );
      if (response.data.code === 0) {
        // 승인된 항목은 상태를 APPROVED로 변경하여 UI 업데이트
        setSubmissions(prevSubmissions =>
          prevSubmissions.map(sub =>
            sub.id === submissionId ? { ...sub, status: "APPROVED" } : sub
          )
        );
        alert(`"${submissions.find(sub => sub.id === submissionId)?.name}" 요청을 승인했습니다.`);
      } else {
        alert(`승인 실패: ${response.data.message}`);
      }
    } catch (error) {
      console.error("❌ 승인 실패:", error);
      alert("승인 처리 중 오류가 발생했습니다.");
    }
  };

  const handleReject = async (submissionId) => {
    try {
      const response = await axios.patch(
        `${ADMIN_API_BASE_URL}/admin/restaurants/submissions/${submissionId}/reject`, {},
        { headers: getAuthHeader() }
      );
      if (response.data.code === 0) {
        // 거절된 항목은 목록에서 제거 (또는 status를 REJECTED로 변경)
        setSubmissions(prevSubmissions => prevSubmissions.filter(sub => sub.id !== submissionId));
        alert(`"${submissions.find(sub => sub.id === submissionId)?.name}" 요청을 거절했습니다.`);
      } else {
        alert(`거절 실패: ${response.data.message}`);
      }
    } catch (error) {
      console.error("❌ 거절 실패:", error);
      alert("거절 처리 중 오류가 발생했습니다.");
    }
  };

  // 대기 중인 요청을 우선적으로 정렬
  const sortedSubmissions = [...submissions].sort((a, b) => {
    if (a.status === "PENDING" && b.status !== "PENDING") return -1;
    if (b.status === "PENDING" && a.status !== "PENDING") return 1;
    return 0;
  });

  const totalPages = Math.ceil(sortedSubmissions.length / itemsPerPage);
  const paginatedSubmissions = sortedSubmissions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (loading) {
    return <p className="text-center text-gray-600 mt-8">로딩 중...</p>;
  }

  return (
    <div className="p-6 bg-gray-100 min-h-screen font-sans"> {/* 배경색 및 폰트 변경 */}
      <h1 className="text-3xl font-extrabold mb-6 text-center text-gray-800">
        📌 식당 등록 요청 목록 관리
      </h1>

      <div className="max-w-4xl mx-auto bg-white shadow-xl rounded-lg p-6"> {/* 그림자 및 패딩 강화 */}
        {paginatedSubmissions.length > 0 ? (
          paginatedSubmissions.map((submission) => (
            <div key={submission.id} className="border-b border-gray-200 last:border-0 py-4"> {/* key를 submission.id로 변경 */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                <div className="mb-2 sm:mb-0">
                  <p className="text-xl font-bold text-gray-800">{submission.name}</p>
                  <p className="text-gray-500 text-xs mb-2">
                    제보자: {submission.submitterNickname ? `${submission.submitterNickname} (${submission.submitterName})` : "익명 제보"}
                  </p>
                  <p className="text-gray-600 text-sm">{submission.address}</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {/* 콩 종류 표시 - beanTypes가 배열이라고 가정 */}
                    {submission.beanTypes && submission.beanTypes.map((type, idx) => (
                      <span key={idx} className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                        {type === "SOY_BEAN" ? "백태콩" : type === "BLACK_BEAN" ? "검은콩" : type === "OTHER_BEAN" ? "기타콩" : type}
                      </span>
                    ))}
                    {/* 판매 기간 표시 */}
                    <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                      {submission.servesAllYear ? "사계절 판매" : `${submission.startMonth}월 ~ ${submission.endMonth}월`}
                    </span>
                    {/* ⭐ 가격 정보 추가 (submission.prices가 BeanPrice 객체 배열이라고 가정) ⭐ */}
                    {submission.prices && submission.prices.map((bp, idx) => (
                      <span key={idx} className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                        {bp.beanType === "SOY_BEAN" ? "백태콩" : bp.beanType === "BLACK_BEAN" ? "검은콩" : bp.beanType === "OTHER_BEAN" ? "기타콩" : bp.beanType}: {bp.price.toLocaleString()}원
                      </span>
                    ))}
                  </div>
                  <p className={`font-bold mt-2 ${submission.status === "PENDING" ? "text-yellow-600" : submission.status === "APPROVED" ? "text-green-600" : "text-red-600"}`}>
                    {submission.status === "PENDING" ? "⏳ 대기 중" : submission.status === "APPROVED" ? "✅ 승인됨" : "❌ 거절됨"}
                  </p>
                </div>

                {submission.status === "PENDING" && (
                  <div className="flex flex-row space-x-2 mt-2 sm:mt-0">
                    <button
                      onClick={() => handleApprove(submission.id)}
                      className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md text-sm font-semibold transition-colors duration-200"
                    >
                      승인
                    </button>
                    <button
                      onClick={() => handleReject(submission.id)}
                      className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm font-semibold transition-colors duration-200"
                    >
                      거절
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <p className="text-center text-gray-500 py-4">등록 요청이 없습니다.</p>
        )}
      </div>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-6 space-x-4">
          <button
            className={`px-5 py-2 rounded-lg font-semibold transition-colors duration-200 ${currentPage === 1 ? "bg-gray-300 text-gray-600 cursor-not-allowed" : "bg-gray-700 hover:bg-gray-800 text-white"}`}
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
          >
            ◀ 이전
          </button>
          <span className="px-5 py-2 bg-white shadow-md rounded-lg text-gray-800 font-semibold">
            {currentPage} / {totalPages}
          </span>
          <button
            className={`px-5 py-2 rounded-lg font-semibold transition-colors duration-200 ${currentPage === totalPages ? "bg-gray-300 text-gray-600 cursor-not-allowed" : "bg-gray-700 hover:bg-gray-800 text-white"}`}
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            다음 ▶
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminRestaurantSubmissions;