import React, { useState, useEffect } from "react";
import axios from "axios";

const AdminRestaurantSubmissions = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [editingSubmission, setEditingSubmission] = useState(null);
  const itemsPerPage = 3;

  const ADMIN_API_BASE_URL = process.env.REACT_APP_ADMIN_API_BASE_URL || 'http://localhost:8081';

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

  const openApproveModal = (submission) => {
    const prices = submission.prices || [];
    const soyPrice = prices.find(p => p.beanType === 'SOY_BEAN')?.price ?? '';
    const blackPrice = prices.find(p => p.beanType === 'BLACK_BEAN')?.price ?? '';
    const otherPrice = prices.find(p => p.beanType === 'OTHER_BEAN')?.price ?? '';

    setEditingSubmission({
      ...submission,
      soyPrice,
      blackPrice,
      otherPrice,
      servesAllYear: submission.servesAllYear ?? true,
      startMonth: submission.startMonth || '',
      endMonth: submission.endMonth || '',
    });
  };

  const handleApproveSubmit = async (e) => {
    e.preventDefault();
    if (!editingSubmission) return;

    const prices = [];
    if (editingSubmission.soyPrice !== '' && editingSubmission.soyPrice !== null) {
      prices.push({ beanType: 'SOY_BEAN', price: parseInt(editingSubmission.soyPrice) });
    }
    if (editingSubmission.blackPrice !== '' && editingSubmission.blackPrice !== null) {
      prices.push({ beanType: 'BLACK_BEAN', price: parseInt(editingSubmission.blackPrice) });
    }
    if (editingSubmission.otherPrice !== '' && editingSubmission.otherPrice !== null) {
      prices.push({ beanType: 'OTHER_BEAN', price: parseInt(editingSubmission.otherPrice) });
    }

    const payload = {
      name: editingSubmission.name,
      address: editingSubmission.address,
      servesAllYear: editingSubmission.servesAllYear,
      startMonth: editingSubmission.servesAllYear ? null : (parseInt(editingSubmission.startMonth) || null),
      endMonth: editingSubmission.servesAllYear ? null : (parseInt(editingSubmission.endMonth) || null),
      prices: prices,
      latitude: editingSubmission.latitude ? parseFloat(editingSubmission.latitude) : null,
      longitude: editingSubmission.longitude ? parseFloat(editingSubmission.longitude) : null,
    };

    try {
      const response = await axios.patch(
        `${ADMIN_API_BASE_URL}/admin/restaurants/submissions/${editingSubmission.id}/approve`, 
        payload,
        { headers: getAuthHeader() }
      );
      if (response.data.code === 0) {
        setSubmissions(prevSubmissions =>
          prevSubmissions.map(sub =>
            sub.id === editingSubmission.id ? { ...sub, ...payload, status: "APPROVED" } : sub
          )
        );
        alert(`"${editingSubmission.name}" 요청을 승인했습니다.`);
        setEditingSubmission(null);
      } else {
        alert(`승인 실패: ${response.data.message}`);
      }
    } catch (error) {
      console.error("❌ 승인 실패:", error);
      alert("승인 처리 중 오류가 발생했습니다.");
    }
  };

  const handleReject = async (submissionId) => {
    const rejectReason = prompt("식당 등록 거절 사유를 입력하세요:");
    if (rejectReason === null) {
      return; // 취소 버튼을 클릭한 경우 중단
    }

    try {
      const response = await axios.patch(
        `${ADMIN_API_BASE_URL}/admin/restaurants/submissions/${submissionId}/reject`, 
        { rejectReason },
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
                    {(submission.servesAllYear || (submission.startMonth > 0 && submission.endMonth > 0)) && (
                      <span className={submission.servesAllYear ? "bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1" : "bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full"}>
                        {submission.servesAllYear ? "👑 개념업소 (사계절 판매)" : `${submission.startMonth}월 ~ ${submission.endMonth}월`}
                      </span>
                    )}
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
                      onClick={() => openApproveModal(submission)}
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

      {/* 승인 모달 */}
      {editingSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 border-b pb-2">
              식당 정보 검토 및 승인
            </h2>
            <form onSubmit={handleApproveSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">식당 이름</label>
                <input
                  type="text"
                  required
                  value={editingSubmission.name || ''}
                  onChange={e => setEditingSubmission({...editingSubmission, name: e.target.value})}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">주소</label>
                <input
                  type="text"
                  required
                  value={editingSubmission.address || ''}
                  onChange={e => setEditingSubmission({...editingSubmission, address: e.target.value})}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center space-x-4 py-2">
                <label className="flex items-center space-x-2 text-sm font-bold text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingSubmission.servesAllYear}
                    onChange={e => setEditingSubmission({...editingSubmission, servesAllYear: e.target.checked})}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span>사계절 판매</span>
                </label>
              </div>

              {!editingSubmission.servesAllYear && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">개시 시작 월 (1~12)</label>
                    <input
                      type="number"
                      min="1"
                      max="12"
                      required
                      value={editingSubmission.startMonth || ''}
                      onChange={e => setEditingSubmission({...editingSubmission, startMonth: e.target.value})}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">개시 종료 월 (1~12)</label>
                    <input
                      type="number"
                      min="1"
                      max="12"
                      required
                      value={editingSubmission.endMonth || ''}
                      onChange={e => setEditingSubmission({...editingSubmission, endMonth: e.target.value})}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              )}

              <div className="border-t pt-4">
                <h3 className="text-sm font-bold text-gray-800 mb-2">가격 정보 (입력하지 않으면 미판매 처리)</h3>
                <div className="space-y-2">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">백태콩 가격</label>
                    <input
                      type="number"
                      value={editingSubmission.soyPrice || ''}
                      onChange={e => setEditingSubmission({...editingSubmission, soyPrice: e.target.value})}
                      placeholder="가격 입력 (원)"
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">검은콩 가격</label>
                    <input
                      type="number"
                      value={editingSubmission.blackPrice || ''}
                      onChange={e => setEditingSubmission({...editingSubmission, blackPrice: e.target.value})}
                      placeholder="가격 입력 (원)"
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">기타콩 가격</label>
                    <input
                      type="number"
                      value={editingSubmission.otherPrice || ''}
                      onChange={e => setEditingSubmission({...editingSubmission, otherPrice: e.target.value})}
                      placeholder="가격 입력 (원)"
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t pt-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">위도 (Latitude)</label>
                  <input
                    type="number"
                    step="any"
                    value={editingSubmission.latitude || ''}
                    onChange={e => setEditingSubmission({...editingSubmission, latitude: e.target.value})}
                    placeholder="자동 계산 또는 직접 입력"
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">경도 (Longitude)</label>
                  <input
                    type="number"
                    step="any"
                    value={editingSubmission.longitude || ''}
                    onChange={e => setEditingSubmission({...editingSubmission, longitude: e.target.value})}
                    placeholder="자동 계산 또는 직접 입력"
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setEditingSubmission(null)}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded text-sm font-bold transition"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded text-sm font-bold transition"
                >
                  수정 및 승인 완료
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminRestaurantSubmissions;