import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../contexts/NotificationContext';

const V2NotificationModal = () => {
  const { notifications, isModalOpen, closeModal } = useNotification();
  const navigate = useNavigate();

  if (!isModalOpen) return null;

  const getNotificationIcon = (type) => {
    if (type?.includes('보안') || type?.includes('이메일')) return 'mark_email_unread';
    if (type?.includes('승인')) return 'check_circle';
    if (type?.includes('거절') || type?.includes('반려')) return 'cancel';
    return 'info';
  };

  const getIconColorClass = (type) => {
    if (type?.includes('보안') || type?.includes('이메일')) return 'text-[#D97706] bg-[#F59E0B]/10';
    if (type?.includes('승인')) return 'text-[#859F3D] bg-[#859F3D]/10';
    if (type?.includes('거절') || type?.includes('반려')) return 'text-[#C96868] bg-[#C96868]/10';
    return 'text-[#695E34] bg-[#695E34]/10';
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-[#695E34]/30 backdrop-blur-sm transition-opacity"
        onClick={closeModal}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-md bg-[#FDF9ED] rounded-[2.5rem] shadow-[0_20px_50px_rgba(105,94,52,0.25)] border border-[#EBE4C9] overflow-hidden flex flex-col max-h-[80vh] transform transition-all animate-enter">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 flex justify-between items-center border-b border-[#EBE4C9]">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#695E34] text-2xl">notifications</span>
            <h2 className="text-[#695E34] font-['Plus_Jakarta_Sans'] font-black text-lg">알림 센터</h2>
          </div>
          <button 
            onClick={closeModal}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#695E34]/60 hover:text-[#695E34] hover:bg-[#695E34]/5 transition-all"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          {notifications.length > 0 ? (
            notifications.map((noti, idx) => (
              <div 
                key={idx}
                onClick={() => {
                  if (noti.isNoEmailWarning || noti.type?.includes('보안')) {
                    closeModal();
                    navigate('/v2/mypage');
                  }
                }}
                className={`bg-white p-4 rounded-[1.5rem] border border-[#EBE4C9]/40 shadow-sm flex items-start gap-3 hover:shadow-md transition-shadow ${
                  noti.isNoEmailWarning || noti.type?.includes('보안') ? 'cursor-pointer hover:bg-amber-50/40' : ''
                }`}
              >
                <div className={`p-2 rounded-full shrink-0 flex items-center justify-center ${getIconColorClass(noti.type)}`}>
                  <span className="material-symbols-outlined text-[20px]">
                    {getNotificationIcon(noti.type)}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex justify-between items-start">
                    <span className="text-[11px] font-black text-[#695E34]/60 uppercase tracking-wide">
                      {noti.type || '알림'}
                    </span>
                  </div>
                  <h4 className="font-black text-[#695E34] text-sm mt-0.5 truncate">
                    {noti.title || '새로운 소식'}
                  </h4>
                  <p className="text-[#695E34]/80 text-xs font-bold mt-1 leading-relaxed">
                    {noti.content}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
              <span className="material-symbols-outlined text-5xl text-[#695E34]/20">notifications_off</span>
              <p className="text-[#695E34]/60 font-black text-sm">받은 알림이 없습니다.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-[#F5EFE0] border-t border-[#EBE4C9] flex justify-end">
          <button 
            onClick={closeModal}
            className="bg-[#695E34] hover:bg-[#534A29] text-white font-black text-xs px-6 py-2.5 rounded-full active:scale-95 transition-transform"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
};

export default V2NotificationModal;
