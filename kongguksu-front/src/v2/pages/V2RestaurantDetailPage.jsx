import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import api from '../api';
import './V2Main.css';

const KAKAO_MAP_SCRIPT_ID = 'kakao-map-sdk';

const loadKakaoMapScript = () => {
  if (window.kakao?.maps) {
    return Promise.resolve(window.kakao);
  }

  return new Promise((resolve, reject) => {
    const existingScript = document.getElementById(KAKAO_MAP_SCRIPT_ID);
    if (existingScript) {
      existingScript.addEventListener('load', () => {
        window.kakao.maps.load(() => resolve(window.kakao));
      });
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
    script.onload = () => {
      window.kakao.maps.load(() => resolve(window.kakao));
    };
    script.onerror = reject;
    document.head.appendChild(script);
  });
};

const getBeanLabel = (beanType) => {
  if (beanType === 'SOY_BEAN') return '백태';
  if (beanType === 'BLACK_BEAN') return '서리태';
  return beanType || '기타';
};

const formatPrice = (price) => {
  const numericPrice = Number(price);
  return Number.isFinite(numericPrice) ? `${numericPrice.toLocaleString()}원` : '가격 정보 없음';
};

const V2RestaurantDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const mapRef = useRef(null);
  const [restaurant, setRestaurant] = useState(null);
  const [comments, setComments] = useState([]);
  const [totalComments, setTotalComments] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchComments = async () => {
    try {
      const response = await api.get(`/restaurants/${id}/comments`);
      // Page 객체이므로 content와 totalElements 접근
      setComments(response.data.data.content || []);
      setTotalComments(response.data.data.totalElements || 0);
    } catch (err) {
      console.error('Failed to fetch comments:', err);
    }
  };

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        setLoading(true);
        const resResponse = await api.get(`/restaurants/${id}`);
        setRestaurant(resResponse.data.data);
        await fetchComments();
      } catch (err) {
        console.error('Failed to fetch restaurant detail:', err);
        setError('식당 정보를 불러오는 데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [id]);

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const token = localStorage.getItem('token');
    if (!token) {
      alert('로그인이 필요한 서비스입니다.');
      navigate(`/v2/login?redirect=${encodeURIComponent(location.pathname)}`);
      return;
    }

    try {
      setSubmitting(true);
      await api.post(`/restaurants/${id}/comments`, { content: newComment });
      setNewComment('');
      await fetchComments();
    } catch (err) {
      console.error('Failed to post comment:', err);
      alert('댓글 등록에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (!restaurant || !restaurant.latitude || !restaurant.longitude) return;
    // ... rest of map code

    const initMap = async () => {
      try {
        const kakao = await loadKakaoMapScript();
        const container = document.getElementById('detail-map');
        if (!container) return;

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
  }, [restaurant]);

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

  return (
    <div className="v2-root bg-background text-on-surface min-h-screen relative overflow-x-hidden">
      {/* TopAppBar */}
      <header className="fixed top-0 w-full z-50 bg-[#FDF9ED]/80 backdrop-blur-xl flex items-center justify-between px-6 py-4">
        <button 
          onClick={() => navigate(-1)}
          className="text-[#695E34] hover:bg-[#FCEBB6]/20 transition-colors active:scale-95 duration-200 p-2 rounded-full"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="text-[#695E34] font-['Plus_Jakarta_Sans'] font-semibold text-lg tracking-tight">콩국수 전문점</h1>
        <button className="text-[#695E34] hover:bg-[#FCEBB6]/20 transition-colors active:scale-95 duration-200 p-2 rounded-full">
          <span className="material-symbols-outlined">share</span>
        </button>
      </header>

      <main className="pt-20 pb-32 px-4 space-y-6 max-w-2xl mx-auto">
        {/* Title Section */}
        <section className="px-2">
          <h2 className="text-primary font-bold text-4xl tracking-tight">{restaurant.name}</h2>
        </section>

        {/* Info Tags */}
        <section className="flex flex-wrap gap-2 px-2">
          {beanTypes.map(bean => (
            <span key={bean} className="bg-secondary-container text-on-secondary-container px-4 py-1.5 rounded-full text-sm font-semibold flex items-center gap-1">
              <span className="material-symbols-outlined text-[18px]">eco</span>
              {getBeanLabel(bean)}: {formatPrice(restaurant.price)}
            </span>
          ))}
          <span className="bg-primary-container text-on-primary-container px-4 py-1.5 rounded-full text-sm font-semibold flex items-center gap-1">
            <span className="material-symbols-outlined text-[18px]">calendar_month</span>
            개시 월: {restaurant.servesAllYear ? '연중무휴' : `${restaurant.startMonth}월 ~ ${restaurant.endMonth}월`}
          </span>
        </section>

        {/* Action Row */}
        <section className="flex gap-3 px-2">
          <button className="flex-1 bg-primary-container text-on-primary-container py-4 rounded-full font-bold flex items-center justify-center gap-2 hover:opacity-80 transition-opacity active:scale-95 duration-200 shadow-[0_10px_20px_rgba(105,94,52,0.05)]">
            <span className="material-symbols-outlined">favorite</span>
            저장하기
          </button>
          <button className="bg-surface-container-highest text-primary w-14 h-14 rounded-full flex items-center justify-center hover:opacity-80 transition-opacity active:scale-95 duration-200">
            <span className="material-symbols-outlined">ios_share</span>
          </button>
        </section>

        {/* Location & Hours */}
        <section className="space-y-4 px-2">
          <div id="detail-map" className="w-full h-48 rounded-xl overflow-hidden shadow-sm bg-surface-container-highest relative">
            {/* Map will be rendered here */}
          </div>
          <div className="space-y-2">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-primary mt-1">location_on</span>
              <div>
                <p className="font-semibold text-on-surface">{restaurant.address}</p>
                {restaurant.roadAddress && <p className="text-tertiary text-sm">{restaurant.roadAddress}</p>}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">schedule</span>
              <p className="font-semibold text-secondary">영업 정보: {restaurant.businessHours || '정보 없음'}</p>
            </div>
          </div>
        </section>

        {/* Comments */}
        <section className="bg-surface-container-highest rounded-xl p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-primary font-bold text-xl">댓글</h3>
            <span className="text-tertiary text-sm font-medium">
              {totalComments === 0 ? '댓글 없음' : `댓글 ${totalComments}개`}
            </span>
          </div>

          {/* Comment Input */}
          <form onSubmit={handleCommentSubmit} className="space-y-3">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-surface-container-lowest border-none focus:ring-2 focus:ring-primary text-sm min-h-[48px] h-[48px] resize-none soy-shadow transition-all flex items-center"
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
                    <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container text-xs font-bold">
                      {comment.nickname?.charAt(0) || '익'}
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

      {/* BottomNavBar */}
      <nav className="fixed bottom-0 left-0 w-full flex justify-around items-center px-4 pb-6 pt-3 bg-[#FDF9ED]/80 backdrop-blur-xl z-50 rounded-t-xl shadow-[0_-20px_40px_rgba(105,94,52,0.08)]">
        <FooterItem icon="dictionary" label="목록" onClick={() => navigate('/v2/list')} />
        <FooterItem icon="map" label="지도" onClick={() => navigate('/v2')} />
        <FooterItem icon="bookmark" label="저장" onClick={() => {}} />
        <FooterItem icon="person" label="내 정보" onClick={() => {}} />
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

export default V2RestaurantDetailPage;
