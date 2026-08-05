import React, { useState } from 'react';
import api from '../api';

const REPORT_CATEGORIES = [
  { id: 'PRICE_BEAN', label: '콩 종류 / 가격 변경', icon: '🍜' },
  { id: 'LOCATION', label: '주소 / 위치 오류', icon: '📍' },
  { id: 'CLOSED', label: '폐업 / 영업 중단', icon: '🚫' },
  { id: 'OTHER', label: '기타 정보 오류', icon: '✏️' },
];

export default function V2ReportEditModal({ isOpen, onClose, restaurantId, restaurantName }) {
  const [selectedCategory, setSelectedCategory] = useState('PRICE_BEAN');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) {
      setErrorMessage('수정 제보 내용을 입력해주세요.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      await api.post(`/restaurants/${restaurantId}/reports`, {
        category: selectedCategory,
        content: content.trim(),
      });
      setSuccessMessage('제보해 주신 정보가 성공적으로 접수되었습니다.\n검토 후 소중히 반영하겠습니다!');
      setTimeout(() => {
        setSuccessMessage('');
        setContent('');
        onClose();
      }, 2000);
    } catch (err) {
      console.error('Report submission failed:', err);
      setErrorMessage(err.response?.data?.message || '제보 등록 중 오류가 발생했습니다. 다시 시도해 주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg bg-[#FAF8F5] rounded-2xl shadow-2xl border border-[#E6E0D4] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-[#F2EDE4] border-b border-[#E6E0D4] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🚩</span>
            <h3 className="text-lg font-bold text-[#3D352E]">식당 정보 수정 제보</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-semibold leading-none"
            aria-label="닫기"
          >
            &times;
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
          {restaurantName && (
            <div className="p-3 bg-[#EFE9DF] rounded-xl border border-[#E0D8C9]">
              <span className="text-xs font-semibold text-[#8C7A6B] block">제보 대상 식당</span>
              <span className="text-sm font-bold text-[#3D352E]">{restaurantName}</span>
            </div>
          )}

          {/* Categories */}
          <div>
            <label className="block text-sm font-bold text-[#4A3E3D] mb-2">
              수정이 필요한 항목을 선택해주세요
            </label>
            <div className="grid grid-cols-2 gap-2">
              {REPORT_CATEGORIES.map((cat) => {
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                      isSelected
                        ? 'bg-[#E07A5F] text-white border-[#E07A5F] shadow-sm'
                        : 'bg-white text-[#4A3E3D] border-[#E2DAD0] hover:border-[#D1C4B5] hover:bg-[#FAF8F5]'
                    }`}
                  >
                    <span>{cat.icon}</span>
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Textarea */}
          <div>
            <label htmlFor="reportContent" className="block text-sm font-bold text-[#4A3E3D] mb-2">
              상세 수정 제보 내용 <span className="text-red-500">*</span>
            </label>
            <textarea
              id="reportContent"
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="예: 콩국수 가격이 11,000원으로 올랐어요 / 국산 검은콩 사용으로 변경되었어요"
              className="w-full p-3 rounded-xl border border-[#DCD5C9] focus:outline-none focus:ring-2 focus:ring-[#E07A5F] bg-white text-sm text-[#3D352E] placeholder-gray-400 resize-none"
            />
          </div>

          {/* Messages */}
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">
              {errorMessage}
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-xl whitespace-pre-line">
              {successMessage}
            </div>
          )}

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-[#D5CBC0] text-sm font-medium text-[#6B5E52] hover:bg-[#EFE9DF] transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-[#E07A5F] hover:bg-[#D0694E] text-white text-sm font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-50"
            >
              {isSubmitting ? '제보 제출 중...' : '제보하기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
