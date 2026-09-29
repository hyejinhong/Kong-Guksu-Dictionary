import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const ADMIN_API_BASE_URL = process.env.REACT_APP_ADMIN_API_BASE_URL || 'http://localhost:8081';

const BLIND_REASONS = [
  { key: 'IRRELEVANT', label: '🍜 콩국수/식당과 무관한 사진', desc: '풍경, 인물 셀카, 관련 없는 물건/음식 등' },
  { key: 'INAPPROPRIATE', label: '⚠️ 부적절/유해한 이미지', desc: '선정성, 혐오, 불쾌감을 주는 콘텐츠' },
  { key: 'SPAM', label: '📢 광고 및 홍보/도배', desc: '외부 상업 광고, 도배성 이미지' },
  { key: 'COPYRIGHT', label: '©️ 도용 및 저작권 침해', desc: '타인 또는 타 사이트 무단 캡처/도용' },
  { key: 'ETC', label: '✏️ 기타 사유', desc: '기타 운영 정책 위반' },
];

export default function AdminReviewImages() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 필터 & 페이징
  const [filter, setFilter] = useState('ALL'); // ALL, NORMAL, BLINDED
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  // 모달 상태
  const [enlargedImage, setEnlargedImage] = useState(null); // 원본 확대 모달
  const [blindModalTarget, setBlindModalTarget] = useState(null); // 블라인드 모달 대상 리뷰
  const [selectedReason, setSelectedReason] = useState('IRRELEVANT');
  const [submitting, setSubmitting] = useState(false);

  const getAuthHeader = () => {
    const token = localStorage.getItem('admin_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchReviewImages = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${ADMIN_API_BASE_URL}/api/admin/reviews/images`, {
        params: {
          filter,
          page,
          size: 12,
        },
        headers: getAuthHeader(),
      });
      const data = response.data?.data;
      if (data) {
        setReviews(data.content || []);
        setTotalPages(data.totalPages || 1);
        setTotalElements(data.totalElements || 0);
      }
    } catch (err) {
      console.error('리뷰 이미지 목록 조회 실패:', err);
      setError('리뷰 이미지를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, [filter, page]);

  useEffect(() => {
    fetchReviewImages();
  }, [fetchReviewImages]);

  // 필터 변경
  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    setPage(0);
  };

  // 블라인드 처리 모달 열기
  const handleOpenBlindModal = (review) => {
    setBlindModalTarget(review);
    setSelectedReason('IRRELEVANT');
  };

  // 블라인드 처리 API 호출
  const handleConfirmBlind = async () => {
    if (!blindModalTarget) return;
    setSubmitting(true);
    try {
      await axios.patch(
        `${ADMIN_API_BASE_URL}/api/admin/reviews/${blindModalTarget.id}/blind-image`,
        {
          blind: true,
          reason: selectedReason,
        },
        { headers: getAuthHeader() }
      );
      setBlindModalTarget(null);
      await fetchReviewImages();
    } catch (err) {
      console.error('블라인드 처리 실패:', err);
      alert('블라인드 처리에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  // 블라인드 해제 API 호출
  const handleUnblind = async (review) => {
    if (!window.confirm(`[${review.restaurantName || '식당'}] 리뷰 사진의 블라인드를 해제하시겠습니까?`)) {
      return;
    }
    try {
      await axios.patch(
        `${ADMIN_API_BASE_URL}/api/admin/reviews/${review.id}/blind-image`,
        {
          blind: false,
        },
        { headers: getAuthHeader() }
      );
      await fetchReviewImages();
    } catch (err) {
      console.error('블라인드 해제 실패:', err);
      alert('블라인드 해제에 실패했습니다.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* 상단 헤더 */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <span>🖼️ 리뷰 사진 검열 대시보드</span>
              <span className="text-sm font-normal text-gray-500 bg-gray-200 px-2.5 py-0.5 rounded-full">
                총 {totalElements}건
              </span>
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              사용자가 업로드한 리뷰 인증샷을 모니터링하고, 콩국수와 관련 없거나 부적절한 사진을 블라인드 처리합니다.
            </p>
          </div>

          {/* 필터 탭 버튼 */}
          <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1 shadow-sm">
            <button
              onClick={() => handleFilterChange('ALL')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                filter === 'ALL'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              전체 사진
            </button>
            <button
              onClick={() => handleFilterChange('NORMAL')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                filter === 'NORMAL'
                  ? 'bg-green-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              정상 노출
            </button>
            <button
              onClick={() => handleFilterChange('BLINDED')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                filter === 'BLINDED'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              블라인드됨
            </button>
          </div>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-700 border border-red-200 flex justify-between items-center">
            <span>{error}</span>
            <button
              onClick={fetchReviewImages}
              className="text-red-700 font-semibold underline hover:text-red-900"
            >
              다시 시도
            </button>
          </div>
        )}

        {/* 로딩 인디케이터 */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-sm text-gray-500 font-medium">사진 목록 불러오는 중...</p>
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-gray-200">
            <span className="text-4xl">📭</span>
            <p className="mt-3 text-gray-500 font-medium">검색된 리뷰 사진이 없습니다.</p>
          </div>
        ) : (
          /* 카드 그리드 */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {reviews.map((item) => (
              <div
                key={item.id}
                className={`bg-white rounded-xl shadow-sm border transition-all overflow-hidden flex flex-col ${
                  item.isImageBlinded
                    ? 'border-red-300 ring-1 ring-red-200'
                    : 'border-gray-200 hover:shadow-md'
                }`}
              >
                {/* 썸네일 영역 */}
                <div className="relative aspect-square bg-gray-100 overflow-hidden group">
                  <img
                    src={item.imageUrl}
                    alt={`${item.restaurantName} 리뷰 사진`}
                    className={`w-full h-full object-cover cursor-pointer transition-transform duration-200 group-hover:scale-105 ${
                      item.isImageBlinded ? 'filter blur-[1px] brightness-75' : ''
                    }`}
                    onClick={() => setEnlargedImage(item.imageUrl)}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://via.placeholder.com/300?text=Image+Load+Error';
                    }}
                  />

                  {/* 블라인드 배지 */}
                  {item.isImageBlinded ? (
                    <div className="absolute top-2 left-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded shadow flex items-center gap-1">
                      <span>🚫 블라인드</span>
                    </div>
                  ) : (
                    <div className="absolute top-2 left-2 bg-green-600/80 backdrop-blur-xs text-white text-xs font-semibold px-2 py-0.5 rounded shadow">
                      정상 노출
                    </div>
                  )}

                  {/* 클릭 시 확대 안내 툴팁 */}
                  <div
                    onClick={() => setEnlargedImage(item.imageUrl)}
                    className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer text-white font-medium text-xs gap-1"
                  >
                    <span>🔍 원본 크게보기</span>
                  </div>
                </div>

                {/* 정보 내용 영역 */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    {/* 식당 이름 & 평점 */}
                    <div className="flex items-start justify-between gap-1 mb-1">
                      <h2 className="font-bold text-gray-900 text-sm truncate" title={item.restaurantName}>
                        {item.restaurantName || '식당 정보 없음'}
                      </h2>
                      <span className="text-amber-500 text-xs font-bold shrink-0">
                        ⭐ {item.rating ? item.rating.toFixed(1) : '-'}
                      </span>
                    </div>

                    {/* 작성자 & 날짜 */}
                    <div className="text-xs text-gray-500 mb-2 flex items-center justify-between">
                      <span className="truncate" title={item.userNickname}>
                        👤 {item.userNickname}
                      </span>
                      <span>{item.visitDate || '-'}</span>
                    </div>

                    {/* 한줄평 (memo) */}
                    <p className="text-xs text-gray-700 bg-gray-50 p-2 rounded-md line-clamp-2 border border-gray-100 mb-2">
                      {item.memo ? `"${item.memo}"` : <span className="text-gray-400 italic">작성된 메모 없음</span>}
                    </p>

                    {/* 블라인드 사유 표시 (블라인드된 경우) */}
                    {item.isImageBlinded && (
                      <div className="text-xs text-red-600 bg-red-50 p-1.5 rounded border border-red-100 mb-2">
                        <span className="font-semibold">사유: </span>
                        {item.imageBlindReasonDescription || '관련 없는 사진'}
                      </div>
                    )}
                  </div>

                  {/* 하단 제어 버튼 */}
                  <div className="pt-2 border-t border-gray-100">
                    {item.isImageBlinded ? (
                      <button
                        onClick={() => handleUnblind(item)}
                        className="w-full py-1.5 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1"
                      >
                        <span>🔓 블라인드 해제</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleOpenBlindModal(item)}
                        className="w-full py-1.5 px-3 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold rounded-lg transition-colors border border-red-200 flex items-center justify-center gap-1"
                      >
                        <span>🚫 사진 블라인드 처리</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <div className="mt-8 flex justify-center items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              이전
            </button>
            <span className="text-xs text-gray-600 font-medium px-2">
              {page + 1} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              다음
            </button>
          </div>
        )}
      </div>

      {/* 블라인드 사유 선택 모달 */}
      {blindModalTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <span>🚫 리뷰 사진 블라인드</span>
              </h3>
              <button
                onClick={() => setBlindModalTarget(null)}
                className="text-gray-400 hover:text-gray-600 text-lg leading-none"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-gray-600 mb-4">
              <span className="font-semibold text-gray-800">[{blindModalTarget.restaurantName}]</span> 리뷰 사진을 블라인드 처리합니다. 작성자에게 해당 사유로 알림이 발송됩니다.
            </p>

            {/* 사유 선택 라디오 */}
            <div className="space-y-2 mb-6">
              {BLIND_REASONS.map((r) => (
                <label
                  key={r.key}
                  className={`flex flex-col p-3 rounded-xl border cursor-pointer transition-all ${
                    selectedReason === r.key
                      ? 'border-red-500 bg-red-50/50 ring-1 ring-red-400'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="blindReason"
                      value={r.key}
                      checked={selectedReason === r.key}
                      onChange={(e) => setSelectedReason(e.target.value)}
                      className="text-red-600 focus:ring-red-500"
                    />
                    <span className="text-xs font-bold text-gray-900">{r.label}</span>
                  </div>
                  <span className="text-[11px] text-gray-500 mt-1 pl-5">{r.desc}</span>
                </label>
              ))}
            </div>

            {/* 모달 버튼 */}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setBlindModalTarget(null)}
                disabled={submitting}
                className="px-4 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleConfirmBlind}
                disabled={submitting}
                className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow transition-colors flex items-center gap-1"
              >
                {submitting ? '처리 중...' : '블라인드 적용'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 이미지 원본 확대 모달 */}
      {enlargedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={() => setEnlargedImage(null)}
        >
          <div className="relative max-w-3xl max-h-[90vh] flex flex-col items-center">
            <button
              onClick={() => setEnlargedImage(null)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300 text-2xl font-bold"
            >
              ✕
            </button>
            <img
              src={enlargedImage}
              alt="확대된 리뷰 사진"
              className="max-h-[85vh] max-w-full object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
}
