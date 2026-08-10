import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import Avatar from 'boring-avatars';
import api from '../api';
import './V2Main.css';
import { useNotification } from '../contexts/NotificationContext';
import V2ShareModal from '../components/V2ShareModal';

const KONG_COLORS = ["#FFFDF0", "#FFD369", "#3D3D3D", "#A9B388", "#FF9F29"];
const KAKAO_MAP_SCRIPT_ID = 'kakao-map-sdk';

const loadKakaoMapScript = () => {
  return new Promise((resolve, reject) => {
    const existingScript = document.getElementById(KAKAO_MAP_SCRIPT_ID);
    
    const handleResolve = () => {
      window.kakao.maps.load(() => resolve(window.kakao));
    };

    if (window.kakao?.maps) {
      handleResolve();
      return;
    }

    if (existingScript) {
      existingScript.addEventListener('load', handleResolve);
      existingScript.addEventListener('error', reject);
      return;
    }

    const kakaoMapApiKey = process.env.REACT_APP_KAKAO_MAP_API_KEY;
    if (!kakaoMapApiKey) {
      reject(new Error('REACT_APP_KAKAO_MAP_API_KEY is missing.'));
      return;
    }

    const script = document.createElement('script');
    script.id = KAKAO_MAP_SCRIPT_ID;
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${kakaoMapApiKey}&autoload=false&libraries=services`;
    script.async = true;
    script.onload = handleResolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
};

const getBeanLabel = (beanType) => {
  if (beanType === 'SOY_BEAN') return '백태';
  if (beanType === 'BLACK_BEAN') return '서리태';
  if (beanType === 'OTHER_BEAN') return '기타';
  return beanType || '기타';
};

const formatPrice = (price) => {
  const numericPrice = Number(price);
  return Number.isFinite(numericPrice) ? `${numericPrice.toLocaleString()}원` : '가격 정보 없음';
};

const renderStarRating = (rating) => {
  const numRating = Math.round(Number(rating) || 0);
  const fullStars = Math.max(0, Math.min(5, numRating));
  const emptyStars = 5 - fullStars;

  return (
    <div className="flex items-center gap-0.5" title={`별점 ${numRating}점`}>
      {Array.from({ length: fullStars }).map((_, i) => (
        <span key={`full-${i}`} className="material-symbols-outlined text-base text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>
          star
        </span>
      ))}
      {Array.from({ length: emptyStars }).map((_, i) => (
        <span key={`empty-${i}`} className="material-symbols-outlined text-base text-outline-variant/30" style={{ fontVariationSettings: "'FILL' 0" }}>
          star
        </span>
      ))}
    </div>
  );
};

const V2RestaurantDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { unread, openModal } = useNotification();
  const mapRef = useRef(null);
  const [restaurant, setRestaurant] = useState(null);
  const [isSaved, setIsSaved] = useState(false);
  const [visitId, setVisitId] = useState(null);
  const [comments, setComments] = useState([]);
  const [totalComments, setTotalComments] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Save Modal States
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [userRating, setUserRating] = useState(5);
  const [userMemo, setUserMemo] = useState('');
  const [saving, setSaving] = useState(false);

  const [visitNotes, setVisitNotes] = useState([]);
  const [loadingVisits, setLoadingVisits] = useState(false);
  const [showAllNotes, setShowAllNotes] = useState(false);

  // Share Modal States
  const [showShareModal, setShowShareModal] = useState(false);

  const fetchComments = async () => {
    try {
      const response = await api.get(`/restaurants/${id}/comments`);
      setComments(response.data.data.content || []);
      setTotalComments(response.data.data.totalElements || 0);
    } catch (err) {
      console.error('Failed to fetch comments:', err);
    }
  };

  const fetchVisitNotes = async () => {
    try {
      setLoadingVisits(true);
      const response = await api.get(`/restaurants/${id}/visits`);
      setVisitNotes(response.data.data || []);
    } catch (err) {
      console.error('Failed to fetch visit notes:', err);
    } finally {
      setLoadingVisits(false);
    }
  };

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        setLoading(true);
        const resResponse = await api.get(`/restaurants/${id}`);
        const data = resResponse.data.data;
        setRestaurant(data);
        setIsSaved(data.isSaved);
        setVisitId(data.visitId);
        await Promise.all([fetchComments(), fetchVisitNotes()]);
      } catch (err) {
        console.error('Failed to fetch restaurant detail:', err);
        setError('식당 정보를 불러오는 데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [id]);

  const handleToggleSave = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('로그인이 필요한 서비스입니다.');
      navigate(`/v2/login?redirect=${encodeURIComponent(location.pathname)}`);
      return;
    }

    if (isSaved) {
      if (window.confirm('나의 사전에서 이 식당을 삭제할까요?')) {
        try {
          await api.delete(`/visited-restaurants/${visitId}`);
          setIsSaved(false);
          setVisitId(null);
          await fetchVisitNotes();
          toast.success('삭제되었습니다.');
        } catch (err) {
          console.error('Failed to delete visit:', err);
          toast.error('삭제에 실패했습니다.');
        }
      }
      return;
    }

    // Open Save Modal
    setShowSaveModal(true);
    setUserRating(5);
    setUserMemo('');
  };

  const handleSaveSubmit = async () => {
    try {
      setSaving(true);
      const today = new Date().toISOString().split('T')[0];
      await api.post('/visited-restaurants', {
        restaurantId: parseInt(id),
        visitDate: today,
        rating: userRating,
        memo: userMemo
      });
      
      const resResponse = await api.get(`/restaurants/${id}`);
      const data = resResponse.data.data;
      setVisitId(data.visitId);
      setIsSaved(true);
      await fetchVisitNotes();
      
      setShowSaveModal(false);
      toast.success('나의 사전에 저장되었습니다!');
    } catch (err) {
      console.error('Failed to save restaurant:', err);
      toast.error('저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('로그인이 필요한 서비스입니다.');
      navigate(`/v2/login?redirect=${encodeURIComponent(location.pathname)}`);
      return;
    }

    try {
      setSubmitting(true);
      await api.post(`/restaurants/${id}/comments`, { content: newComment });
      setNewComment('');
      toast.success('댓글이 등록되었습니다.');
      await fetchComments();
    } catch (err) {
      console.error('Failed to post comment:', err);
      toast.error('댓글 등록에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (!restaurant || !restaurant.latitude || !restaurant.longitude) return;

    const initMap = async () => {
      try {
        const kakao = await loadKakaoMapScript();
        const container = mapRef.current;
        if (!container) return;

        container.innerHTML = '';
        const options = {
          center: new kakao.maps.LatLng(restaurant.latitude, restaurant.longitude),
          level: 3,
        };
        const map = new kakao.maps.Map(container, options);
        
        const markerPosition = new kakao.maps.LatLng(restaurant.latitude, restaurant.longitude);
        const marker = new kakao.maps.Marker({
          position: markerPosition,
        });
        marker.setMap(map);
      } catch (err) {
        console.error('Failed to load Kakao Map:', err);
      }
    };

    initMap();
  }, [restaurant, loading]);

  if (loading) {
    return (
      <div className="v2-root bg-background min-h-screen flex items-center justify-center">
        <div className="text-primary font-bold">로딩 중...</div>
      </div>
    );
  }

  if (error || !restaurant) {
    return (
      <div className="v2-root bg-background min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <div className="text-primary font-bold mb-4">{error || '식당을 찾을 수 없습니다.'}</div>
        <button onClick={() => navigate(-1)} className="bg-primary text-background px-6 py-2 rounded-full">뒤로 가기</button>
      </div>
    );
  }

  const beanTypes = restaurant.beanTypes?.length ? restaurant.beanTypes : [restaurant.beanType].filter(Boolean);
  const selling = restaurant.servesAllYear || (
    (() => {
      const currentMonth = new Date().getMonth() + 1;
      const start = restaurant.startMonth || 6;
      const end = restaurant.endMonth || 8;
      if (start <= end) {
        return currentMonth >= start && currentMonth <= end;
      }
      return currentMonth >= start || currentMonth <= end;
    })()
  );

  const kakaoMapLink = (restaurant.latitude && restaurant.longitude)
    ? `https://map.kakao.com/link/map/${encodeURIComponent(restaurant.name)},${restaurant.latitude},${restaurant.longitude}`
    : `https://map.kakao.com/link/search/${encodeURIComponent(restaurant.address || restaurant.name)}`;


  return (
    <div className="v2-root bg-background text-on-surface min-h-screen relative overflow-x-hidden">
      <title>{`${restaurant.name} | 콩국수 사전`}</title>
      <meta name="description" content={`${restaurant.name} - ${restaurant.address}. 콩 종류: ${beanTypes.map(getBeanLabel).join(', ')}. 가격: ${formatPrice(restaurant.price)}. 맛있는 콩국수 맛집 정보를 확인해 보세요!`} />
      <meta property="og:title" content={`${restaurant.name} | 콩국수 사전`} />
      <meta property="og:description" content={`${restaurant.name} - ${restaurant.address}. 콩 종류: ${beanTypes.map(getBeanLabel).join(', ')}`} />
      <meta property="og:url" content={`https://kong-guksu-dictionary.vercel.app/v2/restaurant/${id}`} />

      {/* TopAppBar */}
      <header className="fixed top-0 w-full z-50 bg-[#FDF9ED]/80 backdrop-blur-xl flex items-center justify-between px-6 py-4">
        <button 
          onClick={() => navigate(-1)}
          className="text-[#695E34] hover:bg-[#FCEBB6]/20 transition-colors active:scale-95 duration-200 p-2 rounded-full"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div className="flex items-center gap-2">
          <img src="/apple-touch-icon.png" alt="Icon" className="w-6 h-6 object-contain" />
          <h1 className="text-[#695E34] font-['Plus_Jakarta_Sans'] font-semibold text-lg tracking-tight">콩국수 전문점</h1>
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

      <main className="pt-20 pb-32 px-4 space-y-6 max-w-2xl mx-auto">
        {/* Title Section */}
        <section className="px-2 flex justify-between items-start">
          <div className="flex flex-col gap-1">
            <h2 className="text-primary font-bold text-4xl tracking-tight">{restaurant.name}</h2>
            {restaurant.averageRating > 0 && (
              <div className="flex items-center gap-1.5 mt-1">
                <span className="material-symbols-outlined text-secondary text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                <span className="text-secondary font-bold text-xl">{restaurant.averageRating.toFixed(1)}</span>
                <span className="text-tertiary text-sm font-medium ml-0.5">평점</span>
              </div>
            )}
          </div>
          <div className="flex flex-col items-center gap-1">
            <img 
              src={selling ? "/images/open.png" : "/images/closed.png"} 
              alt={selling ? "Open" : "Closed"} 
              className="w-10 h-10 object-contain"
            />
            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wide ${selling ? 'bg-secondary/10 text-secondary' : 'bg-outline-variant/10 text-outline-variant'}`}>
              {selling ? '콩국수 개시' : '시즌 종료'}
            </span>
          </div>
        </section>

        {/* Info Tags */}
        <section className="flex flex-wrap gap-2 px-2">
          {restaurant.servesAllYear && (
            <span className="bg-amber-100 text-amber-900 border border-amber-300 px-4 py-1.5 rounded-full text-sm font-bold flex items-center gap-1 shadow-xs">
              👑 개념업소 (사계절 판매)
            </span>
          )}
          {beanTypes.map(bean => (
            <span key={bean} className="bg-secondary-container text-on-secondary-container px-4 py-1.5 rounded-full text-sm font-semibold flex items-center gap-1">
              <span className="material-symbols-outlined text-[18px]">eco</span>
              {getBeanLabel(bean)}
            </span>
          ))}
          {(restaurant.servesAllYear || (restaurant.startMonth > 0 && restaurant.endMonth > 0)) && (
            <span className="bg-primary-container text-on-primary-container px-4 py-1.5 rounded-full text-sm font-semibold flex items-center gap-1">
              <span className="material-symbols-outlined text-[18px]">calendar_month</span>
              개시 월: {restaurant.servesAllYear ? '연중무휴' : `${restaurant.startMonth}월 ~ ${restaurant.endMonth}월`}
            </span>
          )}
        </section>

        {/* Action Row */}
        <section className="flex gap-3 px-2">
          <button 
            onClick={handleToggleSave}
            className={`flex-1 ${isSaved ? 'bg-secondary-container text-on-secondary-container' : 'bg-primary-container text-on-primary-container'} py-4 rounded-full font-bold flex items-center justify-center gap-2 hover:opacity-80 transition-opacity active:scale-95 duration-200 shadow-[0_10px_20px_rgba(105,94,52,0.05)]`}
          >
            <span 
              className="material-symbols-outlined"
              style={{ fontVariationSettings: `'FILL' ${isSaved ? 1 : 0}, 'wght' 600, 'GRAD' 0, 'opsz' 24` }}
            >
              favorite
            </span>
            {isSaved ? '저장됨' : '저장하기'}
          </button>
          <button 
            onClick={() => setShowShareModal(true)}
            className="flex-1 bg-surface-container-low text-primary py-4 rounded-full font-bold flex items-center justify-center gap-2 hover:opacity-80 transition-opacity active:scale-95 duration-200 shadow-[0_10px_20px_rgba(105,94,52,0.05)] border border-primary/10"
          >
            <span className="material-symbols-outlined">share</span>
            공유하기
          </button>
        </section>

        {/* Location & Hours */}
        <section className="space-y-4 px-2">
          <div ref={mapRef} className="w-full h-48 rounded-xl overflow-hidden shadow-sm bg-surface-container-highest relative">
          </div>
          <div className="space-y-2">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-primary mt-1">location_on</span>
              <a 
                href={kakaoMapLink}
                target="_blank"
                rel="noopener noreferrer"
                className="group cursor-pointer block"
              >
                <div className="flex items-center gap-1">
                  <p className="font-semibold text-on-surface group-hover:text-primary transition-colors">{restaurant.address}</p>
                  <span className="material-symbols-outlined text-sm text-tertiary opacity-0 group-hover:opacity-100 transition-opacity">open_in_new</span>
                </div>
                {restaurant.roadAddress && <p className="text-tertiary text-sm group-hover:text-primary transition-colors">{restaurant.roadAddress}</p>}
              </a>
            </div>
          </div>
        </section>

        {/* Menu Section */}
        {restaurant.prices && restaurant.prices.length > 0 && (
          <section className="px-2 space-y-3">
            <h3 className="text-primary font-bold text-xl flex items-center gap-2">
              <span className="material-symbols-outlined">menu_book</span>
              메뉴
            </h3>
            <div className="bg-surface-container-low rounded-2xl overflow-hidden shadow-sm">
              {restaurant.prices.map((p, index) => {
                let beanIcon = "/images/other_bean_!28.png";
                if (p.beanType === 'SOY_BEAN') beanIcon = "/images/soy_bean_128.png";
                else if (p.beanType === 'BLACK_BEAN') beanIcon = "/images/black_bean_128.png";

                return (
                  <div 
                    key={p.beanType} 
                    className={`flex justify-between items-center px-6 py-4 ${index !== restaurant.prices.length - 1 ? 'border-b border-outline-variant/20' : ''}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center overflow-hidden">
                        <img src={beanIcon} alt={p.beanType} className="w-8 h-8 object-contain" />
                      </div>
                      <span className="font-bold text-on-surface">{getBeanLabel(p.beanType)} 콩국수</span>
                    </div>
                    <span className="font-black text-primary text-lg">{formatPrice(p.price)}</span>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Saved User Memos & Reviews Section */}
        <section className="px-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-primary font-bold text-xl flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary">rate_review</span>
              리뷰
            </h3>
            <span className="text-tertiary text-xs font-semibold">
              총 {visitNotes.length}개
            </span>
          </div>

          {visitNotes.length === 0 ? (
            <div className="bg-surface-container-low rounded-2xl p-6 text-center text-tertiary space-y-2 border border-outline-variant/10">
              <span className="material-symbols-outlined text-3xl text-outline-variant">rate_review</span>
              <p className="text-sm font-medium">아직 등록된 리뷰가 없어요.</p>
              <p className="text-xs text-outline-variant">이 식당을 저장하고 첫 번째 리뷰를 남겨보세요! 🌟</p>
            </div>
          ) : (
            <div className="space-y-3">
              {(showAllNotes ? visitNotes : visitNotes.slice(0, 3)).map((note) => (
                <div 
                  key={note.id} 
                  className="bg-surface-container-low rounded-2xl p-5 space-y-3 soy-shadow transition-all hover:bg-surface-container"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <Avatar 
                        size={36} 
                        name={note.avatarSeed || note.nickname} 
                        variant={note.avatarVariant || "beam"} 
                        colors={KONG_COLORS} 
                      />
                      <div>
                        <span className="font-bold text-on-surface text-sm">{note.nickname}</span>
                        {note.visitDate && (
                          <span className="text-[11px] text-tertiary ml-2">
                            {note.visitDate}
                          </span>
                        )}
                      </div>
                    </div>
                    {note.rating && renderStarRating(note.rating)}
                  </div>

                  {note.memo ? (
                    <div className="bg-background/80 rounded-xl p-3.5 text-sm font-medium text-on-surface border border-outline-variant/10 leading-relaxed flex items-start gap-2">
                      <span className="material-symbols-outlined text-tertiary text-lg shrink-0 mt-0.5">format_quote</span>
                      <p className="whitespace-pre-wrap">{note.memo}</p>
                    </div>
                  ) : (
                    <p className="text-xs text-tertiary italic pl-1">이 식당을 나의 사전에 저장했습니다.</p>
                  )}
                </div>
              ))}

              {visitNotes.length > 3 && (
                <button
                  onClick={() => setShowAllNotes(!showAllNotes)}
                  className="w-full py-3 rounded-2xl bg-surface-container-low text-primary font-bold text-sm hover:bg-surface-container transition-all flex items-center justify-center gap-1 border border-outline-variant/10 shadow-sm active:scale-[0.99]"
                >
                  <span>
                    {showAllNotes 
                      ? '리뷰 접기' 
                      : `더 많은 리뷰 보기 (+${visitNotes.length - 3}개)`}
                  </span>
                  <span className="material-symbols-outlined text-lg">
                    {showAllNotes ? 'keyboard_arrow_up' : 'keyboard_arrow_down'}
                  </span>
                </button>
              )}
            </div>
          )}
        </section>

        {/* Comments Section */}
        <section className="bg-surface-container-highest rounded-xl p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-primary font-bold text-xl">댓글</h3>
            <span className="text-tertiary text-sm font-medium">
              {totalComments === 0 ? '댓글 없음' : `댓글 ${totalComments}개`}
            </span>
          </div>

          <form onSubmit={handleCommentSubmit} className="space-y-3">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-surface-container-lowest border-none focus:ring-2 focus:ring-primary text-sm min-h-[48px] h-[48px] resize-none soy-shadow transition-all flex items-center"
              placeholder="댓글을 입력하세요..."
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting || !newComment.trim()}
                className="bg-primary text-background px-6 py-2.5 rounded-full text-sm font-bold active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
              >
                {submitting ? '등록 중...' : '댓글 등록'}
              </button>
            </div>
          </form>

          <div className="space-y-4 pt-2">
            {comments.length > 0 ? comments.map(comment => (
              <div key={comment.id} className="bg-surface-container-lowest p-4 shadow-sm rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center overflow-hidden border border-surface-container shadow-sm">
                      <Avatar
                        size={32}
                        name={comment.avatarSeed || comment.nickname || 'anonymous'}
                        variant={comment.avatarVariant || 'beam'}
                        colors={KONG_COLORS}
                      />
                    </div>
                    <span className="font-semibold text-sm">{comment.nickname || '익명'}</span>
                  </div>
                  <span className="text-tertiary text-[11px]">{new Date(comment.createdAt).toLocaleDateString()}</span>
                </div>
                <p className="text-on-surface text-sm leading-relaxed">{comment.content}</p>
              </div>
            )) : (
              <div className="text-center py-8 text-tertiary text-sm italic bg-surface-container-lowest/50 rounded-lg">
                아직 작성된 댓글이 없습니다. 첫 번째 댓글의 주인공이 되어보세요!
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Save Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center px-4 pb-10 sm:pb-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div 
            className="w-full max-w-md bg-background rounded-[2.5rem] p-8 soy-shadow animate-in slide-in-from-bottom-10 duration-500"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-bold text-primary tracking-tight">나의 사전 등록</h3>
              <button onClick={() => setShowSaveModal(false)} className="text-tertiary p-2 hover:bg-surface-container-low rounded-full transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-8">
              {/* Rating */}
              <div className="space-y-4">
                <label className="text-sm font-bold text-tertiary uppercase tracking-wider block text-center">나의 별점</label>
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button 
                      key={star}
                      onClick={() => setUserRating(star)}
                      className="text-primary active:scale-90 transition-transform"
                    >
                      <span 
                        className="material-symbols-outlined text-4xl"
                        style={{ fontVariationSettings: `'FILL' ${star <= userRating ? 1 : 0}, 'wght' 600` }}
                      >
                        star
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Memo */}
              <div className="space-y-3">
                <label className="text-sm font-bold text-tertiary uppercase tracking-wider block">메모 (선택)</label>
                <textarea
                  value={userMemo}
                  onChange={(e) => setUserMemo(e.target.value)}
                  className="w-full px-5 py-4 rounded-2xl bg-surface-container-low border-none focus:ring-2 focus:ring-primary text-sm min-h-[120px] resize-none soy-shadow transition-all"
                  placeholder="식당에 대한 짧은 평이나 기억하고 싶은 점을 적어주세요."
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowSaveModal(false)}
                  className="flex-1 py-4 rounded-full font-bold text-tertiary hover:bg-surface-container-low transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={handleSaveSubmit}
                  disabled={saving}
                  className="flex-1 bg-primary text-background py-4 rounded-full font-bold hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
                >
                  {saving ? '저장 중...' : '저장하기'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      <V2ShareModal 
        isOpen={showShareModal} 
        onClose={() => setShowShareModal(false)} 
        restaurant={restaurant} 
      />

      {/* BottomNavBar */}
      <nav className="fixed bottom-0 left-0 w-full flex justify-around items-center px-4 pb-6 pt-3 bg-[#FDF9ED]/80 backdrop-blur-xl z-50 rounded-t-xl shadow-[0_-20px_40px_rgba(105,94,52,0.08)]">
        <FooterItem icon="dictionary" label="목록" onClick={() => navigate('/v2?view=list')} />
        <FooterItem icon="map" label="지도" onClick={() => navigate('/v2?view=map')} />
        <FooterItem icon="bookmark" label="저장" onClick={() => {
          if (!isLoggedIn()) {
            toast.error('로그인이 필요한 서비스입니다.');
            navigate(`/v2/login?redirect=${encodeURIComponent(location.pathname)}`);
          } else {
            navigate('/v2/saved');
          }
        }} />
        <FooterItem icon="person" label="내 정보" onClick={() => {
          if (!isLoggedIn()) {
            navigate(`/v2/login?redirect=${encodeURIComponent(location.pathname)}`);
          } else {
            navigate('/v2/mypage');
          }
        }} />
      </nav>
    </div>
  );
};

const isLoggedIn = () => {
  const token = localStorage.getItem('token');
  const exp = localStorage.getItem('exp');
  if (!token || !exp) return false;

  const now = Math.floor(Date.now() / 1000);
  if (now >= Number(exp)) {
    localStorage.removeItem('token');
    localStorage.removeItem('exp');
    localStorage.removeItem('role');
    return false;
  }
  return true;
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
    <span className="material-symbols-outlined" style={{ fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}>{icon}</span>
    <span className="font-label text-[10px] font-semibold tracking-wider uppercase">{label}</span>
  </button>
);

export default V2RestaurantDetailPage;
