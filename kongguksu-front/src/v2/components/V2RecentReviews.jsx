import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Avatar from 'boring-avatars';
import api from '../api';

const KONG_COLORS = ["#FFFDF0", "#FFD369", "#3D3D3D", "#A9B388", "#FF9F29"];

const getBeanLabel = (beanType) => {
  if (beanType === 'SOY_BEAN') return '백태';
  if (beanType === 'BLACK_BEAN') return '서리태';
  if (beanType === 'OTHER_BEAN') return '기타';
  return beanType || '기타';
};

const getSeasoningBadge = (preference) => {
  if (!preference) return null;
  const pref = String(preference).toUpperCase();
  switch (pref) {
    case 'SALT': return { label: '소금', color: 'bg-blue-50 text-blue-800 border-blue-200' };
    case 'SUGAR': return { label: '설탕', color: 'bg-pink-50 text-pink-800 border-pink-200' };
    case 'BOTH': return { label: '단짠', color: 'bg-purple-50 text-purple-800 border-purple-200' };
    case 'NONE': return { label: '순정', color: 'bg-amber-50 text-amber-800 border-amber-200' };
    default: return null;
  }
};

const formatRelativeDate = (dateStr) => {
  if (!dateStr) return '';
  const visit = new Date(dateStr);
  const now = new Date();
  const diffTime = Math.abs(now - visit);
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return '오늘';
  if (diffDays === 1) return '어제';
  if (diffDays < 7) return `${diffDays}일 전`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}주 전`;
  return dateStr;
};

const V2RecentReviews = ({ isMap = false, className = '' }) => {
  const navigate = useNavigate();
  const sliderRef = useRef(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  // 마우스 드래그 스크롤 상태
  const isDownRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);
  const isDraggedRef = useRef(false);

  useEffect(() => {
    let isMounted = true;

    const fetchRecentReviews = async () => {
      try {
        const response = await api.get('/visited-restaurants/recent?page=0&size=10');
        if (isMounted && response.data?.code === 0) {
          const content = response.data.data?.content || response.data.data || [];
          setReviews(content.slice(0, 10));
        }
      } catch (err) {
        console.error('Failed to fetch recent reviews:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchRecentReviews();

    return () => {
      isMounted = false;
    };
  }, []);

  // 마우스 휠 가로 스크롤 (카카오 지도 줌 이벤트와 충돌 방지)
  useEffect(() => {
    const slider = sliderRef.current;
    if (!slider) return;

    const onWheel = (e) => {
      e.stopPropagation();
      e.preventDefault();
      slider.scrollLeft += e.deltaY !== 0 ? e.deltaY : e.deltaX;
    };

    slider.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      slider.removeEventListener('wheel', onWheel);
    };
  }, [reviews]);

  const handleScroll = (direction, e) => {
    if (e) e.stopPropagation();
    if (!sliderRef.current) return;
    const scrollAmount = 300;
    sliderRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  // 마우스 드래그 스크롤 (Grab to scroll)
  const handleMouseDown = (e) => {
    if (!sliderRef.current) return;
    isDownRef.current = true;
    isDraggedRef.current = false;
    startXRef.current = e.pageX - sliderRef.current.offsetLeft;
    scrollLeftRef.current = sliderRef.current.scrollLeft;
  };

  const handleMouseMove = (e) => {
    if (!isDownRef.current || !sliderRef.current) return;
    e.preventDefault();
    const x = e.pageX - sliderRef.current.offsetLeft;
    const walk = (x - startXRef.current) * 1.5;
    if (Math.abs(walk) > 5) {
      isDraggedRef.current = true;
    }
    sliderRef.current.scrollLeft = scrollLeftRef.current - walk;
  };

  const handleMouseUpOrLeave = () => {
    isDownRef.current = false;
  };

  const handleCardClick = (restaurantId, e) => {
    e.stopPropagation();
    if (isDraggedRef.current) {
      isDraggedRef.current = false;
      return;
    }
    navigate(`/v2/restaurant/${restaurantId}`);
  };

  if (loading || !reviews || reviews.length === 0) {
    return null;
  }

  return (
    <div 
      className={`w-full select-none ${className}`}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header & Controls */}
      <div className="flex items-center justify-between px-6 mb-1.5 w-full">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-black text-primary/80 tracking-tight bg-surface-container-lowest/90 backdrop-blur-md px-2.5 py-0.5 rounded-full shadow-xs border border-white/60">
            최근 리뷰 ({reviews.length})
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={(e) => handleScroll('left', e)}
              className="w-7 h-7 rounded-full bg-surface-container-lowest/95 backdrop-blur-md flex items-center justify-center text-primary shadow-xs hover:bg-surface-container active:scale-90 transition-all border border-white/80"
              aria-label="이전 리뷰"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_left</span>
            </button>
            <button
              type="button"
              onClick={(e) => handleScroll('right', e)}
              className="w-7 h-7 rounded-full bg-surface-container-lowest/95 backdrop-blur-md flex items-center justify-center text-primary shadow-xs hover:bg-surface-container active:scale-90 transition-all border border-white/80"
              aria-label="다음 리뷰"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      {/* Horizontal Slider */}
      <div
        ref={sliderRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUpOrLeave}
        onMouseLeave={handleMouseUpOrLeave}
        className="flex gap-2.5 overflow-x-auto pb-2 pt-0.5 px-6 no-scrollbar touch-pan-x cursor-grab active:cursor-grabbing w-full"
      >
        {reviews.map((review) => {
          const seasoningBadge = getSeasoningBadge(review.seasoningPreference);
          const beanTypes = review.beanTypes || [];

          return (
            <div
              key={review.id}
              onClick={(e) => handleCardClick(review.restaurantId, e)}
              className="w-[260px] sm:w-[280px] shrink-0 bg-surface-container-lowest/95 backdrop-blur-md p-3 rounded-2xl border border-white/80 shadow-lg hover:shadow-xl transition-all active:scale-[0.98] cursor-pointer flex items-center gap-3 group"
            >
              {/* Left: Avatar & Rating */}
              <div className="flex flex-col items-center justify-center shrink-0">
                <Avatar
                  size={28}
                  name={review.avatarSeed || review.nickname}
                  variant={review.avatarVariant || "beam"}
                  colors={KONG_COLORS}
                />
                {review.rating != null && (
                  <div className="flex items-center gap-0.5 text-amber-500 font-black text-[10px] mt-1 bg-amber-50/90 px-1.5 py-0.2 rounded-full border border-amber-200/50">
                    <span>★</span>
                    <span className="text-amber-900">{review.rating.toFixed(1)}</span>
                  </div>
                )}
              </div>

              {/* Right: Info & Memo */}
              <div className="flex-1 min-w-0">
                {/* Line 1: Restaurant Name + Badges + User */}
                <div className="flex items-center justify-between gap-1 mb-0.5">
                  <div className="flex items-center gap-1 min-w-0">
                    <h3 className="font-black text-xs text-primary tracking-tight truncate max-w-[110px] group-hover:text-primary/80 transition-colors">
                      {review.restaurantName}
                    </h3>
                    {review.servesAllYear && (
                      <span className="text-[9px] px-1 py-0.2 bg-amber-100 text-amber-900 border border-amber-300 rounded font-black shrink-0">
                        👑
                      </span>
                    )}
                    {beanTypes[0] && (
                      <span className="text-[9px] px-1 py-0.2 bg-surface-container text-secondary rounded font-bold shrink-0">
                        {getBeanLabel(beanTypes[0])}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-[10px] font-bold text-outline truncate max-w-[60px]">
                      {review.nickname}
                    </span>
                    {seasoningBadge && (
                      <span className={`px-1 py-0.2 rounded text-[8px] font-black border ${seasoningBadge.color}`}>
                        {seasoningBadge.label}
                      </span>
                    )}
                  </div>
                </div>

                {/* Line 2: Memo */}
                <p className="text-[11px] text-on-surface font-medium truncate text-left my-0.5">
                  "{review.memo}"
                </p>

                {/* Line 3: Address & Date */}
                <div className="flex items-center justify-between text-[9px] text-tertiary">
                  <span className="truncate max-w-[130px] font-medium">{review.restaurantAddress}</span>
                  <span className="shrink-0">{formatRelativeDate(review.visitDate)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default V2RecentReviews;
