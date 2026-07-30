import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const ADMIN_API_BASE_URL = process.env.REACT_APP_ADMIN_API_BASE_URL || 'http://localhost:8081';

const CATEGORY_MAP = {
  PRICE_BEAN: '콩 종류 / 가격 변경',
  LOCATION: '주소 / 위치 오류',
  CLOSED: '폐업 / 영업 중단',
  OTHER: '기타 정보 오류',
};

const STATUS_MAP = {
  PENDING: { label: '답변대기', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
  RESOLVED: { label: '처리완료', color: 'bg-green-100 text-green-800 border-green-300' },
  REJECTED: { label: '반려됨', color: 'bg-red-100 text-red-800 border-red-300' },
};

export default function AdminRestaurantReports() {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Reply Modal States
  const [activeReplyReport, setActiveReplyReport] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [replyStatus, setReplyStatus] = useState('RESOLVED');
  const [submittingReply, setSubmittingReply] = useState(false);

  const getAuthHeader = () => {
    const token = localStorage.getItem('admin_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${ADMIN_API_BASE_URL}/api/admin/restaurant-reports`, {
        headers: getAuthHeader(),
      });
      setReports(response.data?.data || []);
    } catch (err) {
      console.error('Failed to fetch reports:', err);
      setError('제보 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleOpenReplyModal = (report) => {
    setActiveReplyReport(report);
    setReplyText(report.reply || '');
    setReplyStatus(report.status === 'PENDING' ? 'RESOLVED' : report.status);
  };

  const handleCloseReplyModal = () => {
    setActiveReplyReport(null);
    setReplyText('');
    setReplyStatus('RESOLVED');
  };

  const handleSubmitReply = async (e) => {
    e.preventDefault();
    if (!activeReplyReport) return;

    setSubmittingReply(true);
    try {
      await axios.post(
        `${ADMIN_API_BASE_URL}/api/admin/restaurant-reports/${activeReplyReport.id}/reply`,
        {
          reply: replyText.trim(),
          status: replyStatus,
        },
        { headers: getAuthHeader() }
      );

      alert('답변이 등록되었으며, 해당 유저에게 알림이 발송되었습니다.');
      handleCloseReplyModal();
      fetchReports();
    } catch (err) {
      console.error('Failed to submit reply:', err);
      alert('답변 등록 중 오류가 발생했습니다.');
    } finally {
      setSubmittingReply(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">🚩 식당 정보 수정 제보 관리</h2>
        <button
          onClick={fetchReports}
          className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg text-sm transition-colors"
        >
          🔄 새로고침
        </button>
      </div>

      {loading && <div className="text-center py-8 text-gray-500 font-semibold">로딩 중...</div>}
      {error && <div className="p-4 bg-red-100 text-red-700 rounded-lg mb-4">{error}</div>}

      {!loading && !error && (
        <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-100 text-gray-700 font-semibold text-sm border-b">
                <th className="p-4">ID</th>
                <th className="p-4">식당 정보</th>
                <th className="p-4">제보 유형</th>
                <th className="p-4">제보 내용</th>
                <th className="p-4">제보자</th>
                <th className="p-4">답변 내역</th>
                <th className="p-4 text-center">상태</th>
                <th className="p-4 text-center">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-sm">
              {reports.length === 0 ? (
                <tr>
                  <td colSpan="8" className="p-8 text-center text-gray-400">
                    접수된 수정 제보가 없습니다.
                  </td>
                </tr>
              ) : (
                reports.map((report) => {
                  const statusInfo = STATUS_MAP[report.status] || { label: report.status, color: 'bg-gray-100 text-gray-800' };
                  const isMember = report.userId != null;

                  return (
                    <tr key={report.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4 font-bold text-gray-600">#{report.id}</td>
                      <td className="p-4">
                        <div className="flex flex-col gap-1">
                          <span className="font-semibold text-blue-600">식당 #{report.restaurantId}</span>
                          <button
                            onClick={() => navigate(`/restaurants/edit/${report.restaurantId}`)}
                            className="inline-flex items-center gap-1 text-xs text-[#E07A5F] hover:underline font-bold"
                          >
                            ✏️ 식당 수정 바로가기
                          </button>
                        </div>
                      </td>
                      <td className="p-4 font-medium text-gray-800">
                        {CATEGORY_MAP[report.category] || report.category}
                      </td>
                      <td className="p-4 text-gray-800 whitespace-pre-wrap max-w-xs">{report.content}</td>
                      <td className="p-4 text-gray-600">
                        {isMember ? (
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-700 font-semibold rounded text-xs">
                            {report.userNickname || `유저 #${report.userId}`}
                          </span>
                        ) : (
                          <span className="text-gray-400">익명</span>
                        )}
                      </td>
                      <td className="p-4 text-xs text-gray-600 max-w-xs">
                        {report.reply ? (
                          <div className="p-2 bg-gray-50 rounded border border-gray-200 whitespace-pre-wrap">
                            <span className="font-bold text-gray-700 block mb-0.5">💬 등록된 답변:</span>
                            {report.reply}
                          </div>
                        ) : (
                          <span className="text-gray-400 italic">답변 없음</span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${statusInfo.color}`}>
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex flex-col gap-1.5 items-center">
                          <button
                            onClick={() => handleOpenReplyModal(report)}
                            className="w-full px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded text-xs font-bold transition-colors shadow-sm"
                          >
                            💬 답변 작성/알림
                          </button>
                          <button
                            onClick={() => navigate(`/restaurants/edit/${report.restaurantId}`)}
                            className="w-full px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold transition-colors shadow-sm"
                          >
                            ✏️ 식당 수정
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Reply Modal */}
      {activeReplyReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-gray-200">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-lg font-bold text-gray-800">
                💬 관리자 답변 작성 및 유저 알림
              </h3>
              <button
                onClick={handleCloseReplyModal}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold"
              >
                &times;
              </button>
            </div>

            <div className="p-3 bg-gray-50 rounded-xl text-xs space-y-1 border">
              <div>
                <span className="font-bold text-gray-600">제보 ID:</span> #{activeReplyReport.id} |{' '}
                <span className="font-bold text-gray-600">식당 ID:</span> #{activeReplyReport.restaurantId}
              </div>
              <div>
                <span className="font-bold text-gray-600">제보 내용:</span> {activeReplyReport.content}
              </div>
              <div>
                <span className="font-bold text-gray-600">제보 유저:</span>{' '}
                {activeReplyReport.userId ? activeReplyReport.userNickname || `유저 #${activeReplyReport.userId}` : '익명'}
              </div>
            </div>

            <form onSubmit={handleSubmitReply} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  상태 변경
                </label>
                <select
                  value={replyStatus}
                  onChange={(e) => setReplyStatus(e.target.value)}
                  className="w-full p-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="RESOLVED">✅ 처리완료 (RESOLVED)</option>
                  <option value="REJECTED">❌ 반려됨 (REJECTED)</option>
                  <option value="PENDING">⏳ 답변대기 (PENDING)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  관리자 답변 내용
                </label>
                <textarea
                  rows={4}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="유저에게 전달될 답변 내용을 입력하세요. (로그인 회원인 경우 종모양 알림이 발송됩니다)"
                  className="w-full p-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={handleCloseReplyModal}
                  className="px-4 py-2 rounded-xl border text-sm font-semibold text-gray-600 hover:bg-gray-100"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={submittingReply}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow transition-colors disabled:opacity-50"
                >
                  {submittingReply ? '등록 중...' : '답변 저장 & 알림 발송'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
