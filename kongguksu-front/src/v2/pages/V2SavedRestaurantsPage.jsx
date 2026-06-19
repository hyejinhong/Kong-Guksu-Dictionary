import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api';
import './V2Main.css';
import { useNotification } from '../contexts/NotificationContext';

const getBeanLabel = (beanType) => {
  if (beanType === 'SOY_BEAN') return '백태';
  if (beanType === 'BLACK_BEAN') return '서리태';
  return beanType || '기타';
};

const formatPrice = (price) => {
  const numericPrice = Number(price);
  return Number.isFinite(numericPrice) ? `${numericPrice.toLocaleString()}원` : '가격 정보 없음';
};

const isLoggedIn = () => {
  const token = localStorage.getItem('token');
  const exp = localStorage.getItem('exp');
  if (!token || !exp) return false;

  const now = Math.floor(Date.now() / 1000);
  if (now >= Number(exp)) {
    localStorage.removeItem('token');
    localStorage.removeItem('exp');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('role');
    return false;
  }
  return true;
};

const V2SavedRestaurantsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { unread, openModal } = useNotification();
  const [savedItems, setSavedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSavedRestaurants = useCallback(async () => {
    if (!isLoggedIn()) {
      navigate(`/v2/login?redirect=${encodeURIComponent(location.pathname)}`);
      return;
    }

    try {
      setLoading(true);
      const response = await api.get('/visited-restaurants?page=0&size=100');
      if (response.data.code === 0) {
        setSavedItems(response.data.data || []);
      } else {
        setError(response.data.message || '데이터를 불러오는 데 실패했습니다.');
      }
    } catch (err) {
      console.error('Failed to fetch saved restaurants:', err);
      setError('저장된 식당 목록을 불러오는 데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [navigate, location.pathname]);

  useEffect(() => {
    fetchSavedRestaurants();
  }, [fetchSavedRestaurants]);

  const handleDelete = async (e, visitId, restaurantName) => {
    e.stopPropagation();
    e.preventDefault();

    if (!window.confirm(`"${restaurantName}"을(를) 저장 목록에서 삭제할까요?`)) {
      return;
    }

    try {
      await api.delete(`/visited-restaurants/${visitId}`);
      setSavedItems(prev => prev.filter(item => item.id !== visitId));
      toast.success('삭제되었습니다.');
    } catch (err) {
      console.error('Failed to delete saved restaurant:', err);
      toast.error('삭제에 실패했습니다.');
    }
  };

  if (loading) {
    return (
      <div className="v2-root bg-background min-h-screen flex items-center justify-center">
        <div className="text-primary font-bold">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="v2-root bg-background text-on-surface min-h-screen relative overflow-x-hidden flex flex-col">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-[#FDF9ED]/80 backdrop-blur-xl flex items-center justify-between px-6 py-4">
        <button 
          onClick={() => navigate(-1)}
          className="text-[#695E34] hover:bg-[#FCEBB6]/20 transition-colors active:scale-95 duration-200 p-2 rounded-full"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div className="flex items-center gap-2">
          <img src="/images/noodles.png" alt="Icon" className="w-6 h-6 object-contain" />
          <h1 className="text-[#695E34] font-['Plus_Jakarta_Sans'] font-semibold text-lg tracking-tight">나의 저장 목록</h1>
        </div>
        <div className="flex items-center justify-end w-10">
          <button 
            onClick={openModal}
            className="relative w-10 h-10 rounded-full flex items-center justify-center text-[#695E34] hover:bg-[#695E34]/5 active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-2xl">notifications</span>
            {unread && (
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border border-[#FDF9ED]" />
            )}
          </button>
        </div>
      </header>

      <main className="flex-1 pt-20 pb-32 px-4 space-y-4 max-w-2xl mx-auto w-full overflow-y-auto no-scrollbar">
        {savedItems.length > 0 ? (
          savedItems.map((item) => (
            <div 
              key={item.id}
              onClick={() => navigate(`/v2/restaurant/${item.restaurant.id}`)}
              className="bg-surface-container-lowest p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow cursor-pointer relative group flex gap-4 items-start"
            >
              <div className="w-16 h-16 rounded-xl bg-primary-container flex items-center justify-center shrink-0">
                <img src="/images/noodles.png" alt="Noodles" className="w-10 h-10 object-contain" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="text-xl font-bold text-primary group-hover:text-primary/80 transition-colors truncate">
                    {item.restaurant.name}
                  </h3>
                  <button 
                    onClick={(e) => handleDelete(e, item.id, item.restaurant.name)}
                    className="text-tertiary/40 hover:text-error transition-colors p-1"
                  >
                    <span className="material-symbols-outlined text-[20px]">delete</span>
                  </button>
                </div>

                <div className="flex items-center gap-2 text-sm text-tertiary mb-2">
                  <span className="material-symbols-outlined text-[16px]">location_on</span>
                  <span className="truncate">{item.restaurant.address}</span>
                  {item.restaurant.distance != null && item.restaurant.distance !== -1 && (
                    <span className="text-primary font-semibold ml-auto shrink-0">
                      {item.restaurant.distance.toFixed(1)}km
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 mb-3">
                  {(item.restaurant.beanTypes || []).map(bean => (
                    <span key={bean} className="bg-secondary-container/50 text-on-secondary-container px-3 py-1 rounded-full text-[11px] font-bold">
                      {getBeanLabel(bean)}
                    </span>
                  ))}
                </div>

                {/* Visit Info */}
                <div className="bg-surface-container-low/50 rounded-xl p-3 flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-tertiary font-medium">저장일: {item.visitedDate}</span>
                    <div className="flex text-primary">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: `'FILL' ${i < (item.rating || 0) ? 1 : 0}` }}>
                          star
                        </span>
                      ))}
                    </div>
                  </div>
                  {item.memo && (
                    <p className="text-xs text-on-surface/70 italic line-clamp-1 mt-1">
                      "{item.memo}"
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
            <span className="material-symbols-outlined text-6xl text-tertiary/20">bookmark</span>
            <p className="text-tertiary font-medium">아직 저장된 식당이 없습니다.</p>
            <button 
              onClick={() => navigate('/v2')}
              className="bg-primary text-background px-6 py-2.5 rounded-full text-sm font-bold active:scale-95 transition-all shadow-lg shadow-primary/20"
            >
              식당 찾아보기
            </button>
          </div>
        )}
      </main>

      {/* Footer Nav */}
      <nav className="fixed bottom-0 left-0 w-full flex justify-around items-center px-4 pb-6 pt-3 bg-[#FDF9ED]/80 backdrop-blur-xl z-50 rounded-t-xl shadow-[0_-20px_40px_rgba(105,94,52,0.08)]">
        <FooterItem icon="leaderboard" label="랭킹" onClick={() => navigate('/v2/ranking')} />
        <FooterItem icon="dictionary" label="목록" onClick={() => navigate('/v2')} />
        <FooterItem icon="map" label="지도" onClick={() => navigate('/v2')} />
        <FooterItem active={true} icon="bookmark" label="저장" onClick={() => {}} />
        <FooterItem icon="person" label="내 정보" onClick={() => navigate('/v2/mypage')} />
      </nav>
    </div>
  );
};

const FooterItem = ({ active = false, icon, label, onClick }) => (
  <button
    className={`flex flex-col items-center justify-center rounded-full active:scale-90 transition-all duration-300 ${
      active
        ? 'bg-primary-container text-primary px-5 py-2'
        : 'text-tertiary opacity-60 hover:bg-surface-container-low p-2'
    }`}
    onClick={onClick}
    type="button"
  >
    <span className="material-symbols-outlined">{icon}</span>
    <span className="font-label text-[10px] font-semibold tracking-wider uppercase">{label}</span>
  </button>
);

export default V2SavedRestaurantsPage;
