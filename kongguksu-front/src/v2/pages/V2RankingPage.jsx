import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import './V2Main.css';

const getBeanLabel = (beanType) => {
  if (beanType === 'SOY_BEAN') return '백태';
  if (beanType === 'BLACK_BEAN') return '서리태';
  return beanType || '기타';
};

const isCurrentlyServing = (restaurant) => {
  const { startMonth, endMonth, servesAllYear } = restaurant;
  const currentMonth = new Date().getMonth() + 1;

  if (servesAllYear) return true;
  
  // 개시월 정보가 없으면 여름 시즌(6월 ~ 8월)을 기본값으로 적용
  const actualStart = startMonth || 6;
  const actualEnd = endMonth || 8;

  if (actualStart <= actualEnd) {
    return actualStart <= currentMonth && currentMonth <= actualEnd;
  }

  return currentMonth >= actualStart || currentMonth <= actualEnd;
};

const V2RankingPage = () => {
  const navigate = useNavigate();
  const [rankingType, setRankingType] = useState('views'); // 'views' or 'rating'
  const [viewPeriod, setViewPeriod] = useState('daily'); // 'daily' or 'all'
  const [rankingData, setRankingData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRanking = useCallback(async () => {
    setLoading(true);
    try {
      let endpoint = '';
      if (rankingType === 'views') {
        endpoint = `/restaurants/ranking?period=${viewPeriod}`;
      } else {
        endpoint = '/restaurants/ranking/rating';
      }
      
      const response = await api.get(endpoint);
      if (response.data.code === 0) {
        setRankingData(response.data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch ranking:', err);
    } finally {
      setLoading(false);
    }
  }, [rankingType, viewPeriod]);

  useEffect(() => {
    fetchRanking();
  }, [fetchRanking]);

  return (
    <div className="v2-root bg-background text-on-surface min-h-screen relative overflow-x-hidden flex flex-col">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-[#FDF9ED]/80 backdrop-blur-xl flex flex-col px-6 pt-4 pb-2 border-b border-surface-container">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-2xl">leaderboard</span>
            <h1 className="text-[#695E34] font-['Plus_Jakarta_Sans'] font-black text-xl tracking-tight">실시간 랭킹</h1>
          </div>
          <img src="/apple-touch-icon.png" alt="Icon" className="w-8 h-8 object-contain" />
        </div>

        {/* Ranking Type Tabs */}
        <div className="flex gap-2 p-1 bg-surface-container-low rounded-2xl mb-2">
          <button
            onClick={() => setRankingType('views')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all ${
              rankingType === 'views' 
                ? 'bg-primary text-background shadow-md' 
                : 'text-tertiary hover:bg-surface-container-high'
            }`}
          >
            인기순 (조회수)
          </button>
          <button
            onClick={() => setRankingType('rating')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all ${
              rankingType === 'rating' 
                ? 'bg-primary text-background shadow-md' 
                : 'text-tertiary hover:bg-surface-container-high'
            }`}
          >
            별점순 (추천)
          </button>
        </div>

        {/* View Period Selection (Only for views) */}
        {rankingType === 'views' && (
          <div className="flex justify-center gap-6 pb-2">
            <button
              onClick={() => setViewPeriod('daily')}
              className={`text-[11px] font-black transition-all ${
                viewPeriod === 'daily' ? 'text-primary border-b-2 border-primary' : 'text-tertiary/40'
              }`}
            >
              오늘의 인기
            </button>
            <button
              onClick={() => setViewPeriod('all')}
              className={`text-[11px] font-black transition-all ${
                viewPeriod === 'all' ? 'text-primary border-b-2 border-primary' : 'text-tertiary/40'
              }`}
            >
              전체 누적
            </button>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 pt-44 pb-32 px-4 space-y-4 max-w-2xl mx-auto w-full">
        {loading ? (
          <div className="text-center py-20 text-primary font-bold">랭킹 데이터를 불러오는 중...</div>
        ) : rankingData.length > 0 ? (
          <div className="space-y-4">
            {rankingData.map((item, index) => (
              <div
                key={item.id}
                onClick={() => navigate(`/v2/restaurant/${item.id}`)}
                className="bg-surface-container-lowest p-5 rounded-[2rem] shadow-sm border border-surface-container flex items-center gap-4 active:scale-[0.98] transition-all cursor-pointer hover:shadow-md"
              >
                {/* Rank Badge */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-black text-lg ${
                  index === 0 ? 'bg-amber-400 text-white shadow-lg shadow-amber-200' :
                  index === 1 ? 'bg-slate-300 text-white shadow-lg shadow-slate-100' :
                  index === 2 ? 'bg-orange-300 text-white shadow-lg shadow-orange-100' :
                  'bg-surface-container text-tertiary'
                }`}>
                  {index + 1}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2 min-w-0">
                      <h3 className="font-black text-primary text-lg truncate">{item.name}</h3>
                      <img 
                        src={isCurrentlyServing(item) ? "/images/open.png" : "/images/closed.png"} 
                        alt="Status" 
                        className="w-5 h-5 object-contain shrink-0"
                      />
                    </div>
                    <div className="flex items-center gap-1 bg-primary/5 px-2 py-0.5 rounded-full shrink-0">
                      <span className="material-symbols-outlined text-primary text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                        {rankingType === 'views' ? 'visibility' : 'star'}
                      </span>
                      <span className="text-primary font-black text-xs">
                        {rankingType === 'views' 
                          ? (viewPeriod === 'daily' ? (item.dailyViewCount || 0).toLocaleString() : (item.viewCount || 0).toLocaleString())
                          : (item.averageRating || 0).toFixed(1)}
                      </span>
                    </div>
                  </div>
                  <p className="text-outline text-xs font-bold flex items-center gap-1 mt-1 truncate">
                    <span className="material-symbols-outlined text-[14px]">location_on</span>
                    {item.address}
                  </p>
                  <div className="flex items-center gap-2 mt-3">
                    <div className="flex gap-2">
                      {(item.beanTypes || []).map(bean => (
                        <span key={bean} className="px-2.5 py-0.5 bg-surface-container rounded-full text-[10px] font-black text-secondary">
                          {getBeanLabel(bean)}
                        </span>
                      ))}
                    </div>
                    {!isCurrentlyServing(item) && (
                      <span className="px-2 py-0.5 bg-outline-variant/10 text-outline-variant text-[10px] font-black rounded-full uppercase tracking-wide">
                        시즌 종료
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
            <span className="material-symbols-outlined text-6xl text-tertiary/20">leaderboard</span>
            <p className="text-tertiary font-medium">아직 집계된 랭킹 데이터가 없습니다.</p>
          </div>
        )}
      </main>

      {/* Footer Nav */}
      <nav className="fixed bottom-0 left-0 w-full flex justify-around items-center px-4 pb-6 pt-3 bg-[#FDF9ED]/80 backdrop-blur-xl z-50 rounded-t-xl shadow-[0_-20px_40px_rgba(105,94,52,0.08)]">
        <FooterItem active={true} icon="leaderboard" label="랭킹" onClick={() => {}} />
        <FooterItem icon="dictionary" label="목록" onClick={() => navigate('/v2?view=list')} />
        <FooterItem icon="map" label="지도" onClick={() => navigate('/v2?view=map')} />
        <FooterItem icon="bookmark" label="저장" onClick={() => navigate('/v2/saved')} />
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
    <span className="material-symbols-outlined" style={{ fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}>
      {icon}
    </span>
    <span className="font-label text-[10px] font-semibold tracking-wider uppercase">{label}</span>
  </button>
);

export default V2RankingPage;
