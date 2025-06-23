import React, { useState, useEffect } from "react";

const VisitModal = ({ editingVisit, onChange, onClose, onSave }) => {
  // editingVisit 없으면 기본값으로 초기화해서 훅 호출 보장
  const [userRating, setUserRating] = useState(editingVisit?.rating || 0);

  // editingVisit이 바뀔 때마다 userRating 초기화
  useEffect(() => {
    setUserRating(editingVisit?.rating || 0);
  }, [editingVisit]);

  // userRating 변경 시 onChange 호출
  useEffect(() => {
    if (editingVisit) {
      onChange({ ...editingVisit, rating: userRating });
    }
  }, [userRating]);

  // editingVisit 없으면 모달 안 띄움
  if (!editingVisit) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-96 shadow-lg">
        <h2 className="text-xl font-bold mb-4 text-[#5C5C5C]">✏️ 수정하기</h2>

        <label className="block mb-2 text-sm">방문일</label>
        <input
          type="date"
          className="w-full border p-2 rounded mb-4"
          value={editingVisit.visitedDate || ''}
          onChange={e => onChange({ ...editingVisit, visitedDate: e.target.value })}
        />

        <label className="block mb-2 text-sm">별점</label>
        <div className="mb-4 text-center">
          {[1, 2, 3, 4, 5].map((star) => (
            <span
              key={star}
              className={`text-3xl cursor-pointer ${
                star <= userRating ? "text-yellow-400" : "text-gray-300"
              }`}
              onClick={() => setUserRating(star)}
            >
              ★
            </span>
          ))}
        </div>

        <label className="block mb-2 text-sm">메모</label>
        <textarea
          className="w-full border p-2 rounded mb-4"
          value={editingVisit.memo || ''}
          onChange={e => onChange({ ...editingVisit, memo: e.target.value })}
        />

        <div className="flex justify-between">
          <button className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400" onClick={onClose}>
            취소
          </button>
          <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600" onClick={onSave}>
            저장
          </button>
        </div>
      </div>
    </div>
  );
};

export default VisitModal;
