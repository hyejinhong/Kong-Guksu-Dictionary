import React from "react";

function NotificationModal({ notifications, onClose }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white w-11/12 max-w-md p-4 rounded-lg shadow-lg">
        <h2 className="text-xl font-bold mb-4">🔔 알림</h2>
        <ul className="max-h-80 overflow-y-auto">
          {notifications.length > 0 ? (
            notifications.map((note, index) => (
              <li key={index} className="border-b py-2">
                {note.message || "내용 없음"}
              </li>
            ))
          ) : (
            <li>알림이 없습니다.</li>
          )}
        </ul>
        <div className="mt-4 flex justify-end">
          <button
            className="px-4 py-2 bg-[#57B4BA] text-white rounded-md"
            onClick={onClose}
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}

export default NotificationModal;
