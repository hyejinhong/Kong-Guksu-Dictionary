import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import V2UserAvatar from '../components/V2UserAvatar';
import api from '../api';
import './V2Main.css';
import { useNotification } from '../contexts/NotificationContext';

const getBeanLabel = (beanType) => {
  if (beanType === 'SOY_BEAN') return '백태';
  if (beanType === 'BLACK_BEAN') return '서리태';
  return beanType || '기타';
};

const getSeasoningBadge = (preference) => {
  if (!preference) return null;
  const pref = String(preference).toUpperCase();
  switch (pref) {
    case 'SALT': return { label: '소금 🧂', color: 'bg-blue-100 text-blue-800 border-blue-200' };
    case 'SUGAR': return { label: '설탕 🍬', color: 'bg-pink-100 text-pink-800 border-pink-200' };
    case 'BOTH': return { label: '단짠 🧂🍬', color: 'bg-purple-100 text-purple-800 border-purple-200' };
    case 'NONE': return { label: '순정 🫘', color: 'bg-amber-100 text-amber-800 border-amber-200' };
    default: return null;
  }
};

const isLoggedIn = () => {
  const token = localStorage.getItem('token');
  const exp = localStorage.getItem('exp');
  if (!token || !exp) return false;

  const now = Math.floor(Date.now() / 1000);
  const expiryTimeInSeconds = Number(exp) > 1e11 ? Math.floor(Number(exp) / 1000) : Number(exp);
  if (now >= expiryTimeInSeconds) {
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
  const [searchParams, setSearchParams] = useSearchParams();
  const { unread, openModal } = useNotification();

  const tabParam = searchParams.get('tab');
  const initialMainTab = tabParam === 'followings' || tabParam === 'followers' || tabParam === 'follow' ? 'follow' : 'saved';
  const initialFollowSubTab = tabParam === 'followers' ? 'followers' : 'followings';

  const [activeTab, setActiveTab] = useState(initialMainTab); // 'saved' | 'follow'
  const [followSubTab, setFollowSubTab] = useState(initialFollowSubTab); // 'followings' | 'followers'

  const [savedItems, setSavedItems] = useState([]);
  const [followingUsers, setFollowingUsers] = useState([]);
  const [followerUsers, setFollowerUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);
  const [togglingId, setTogglingId] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const currentTab = searchParams.get('tab');
    if (currentTab === 'followings' || currentTab === 'follow') {
      setActiveTab('follow');
      setFollowSubTab('followings');
    } else if (currentTab === 'followers') {
      setActiveTab('follow');
      setFollowSubTab('followers');
    } else if (currentTab === 'saved') {
      setActiveTab('saved');
    }
  }, [searchParams]);

  const fetchSavedRestaurants = useCallback(async () => {
    if (!isLoggedIn()) {
      navigate(`/v2/login?redirect=${encodeURIComponent(location.pathname + location.search)}`);
      return;
    }

    try {
      setLoading(true);
      const response = await api.get('/visited-restaurants?page=0&size=100');
      if (response.data.code === 0) {
        const list = response.data.data?.content || response.data.data || [];
        setSavedItems(list);
      } else {
        setError(response.data.message || '데이터를 불러오는 데 실패했습니다.');
      }
    } catch (err) {
      console.error('Failed to fetch saved restaurants:', err);
      setError('저장된 식당 목록을 불러오는 데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [navigate, location.pathname, location.search]);

  const fetchFollowData = useCallback(async () => {
    if (!isLoggedIn()) return;

    try {
      setFollowLoading(true);
      const [followingsRes, followersRes] = await Promise.all([
        api.get('/users/me/followings?page=0&size=100'),
        api.get('/users/me/followers?page=0&size=100'),
      ]);

      if (followingsRes.data?.code === 0) {
        const list = followingsRes.data.data?.content || followingsRes.data.data || [];
        setFollowingUsers(list);
      }
      if (followersRes.data?.code === 0) {
        const list = followersRes.data.data?.content || followersRes.data.data || [];
        setFollowerUsers(list);
      }
    } catch (err) {
      console.error('Failed to fetch follow data:', err);
    } finally {
      setFollowLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSavedRestaurants();
    fetchFollowData();
  }, [fetchSavedRestaurants, fetchFollowData]);

  const handleMainTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'saved') {
      setSearchParams({ tab: 'saved' }, { replace: true });
    } else {
      setSearchParams({ tab: followSubTab }, { replace: true });
    }
  };

  const handleSubTabChange = (subTab) => {
    setFollowSubTab(subTab);
    setSearchParams({ tab: subTab }, { replace: true });
  };

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

  const handleToggleFollow = async (e, targetUser) => {
    e.stopPropagation();
    if (!isLoggedIn()) {
      toast.error('로그인이 필요한 기능입니다.');
      navigate('/v2/login');
      return;
    }

    setTogglingId(targetUser.userId);
    try {
      const res = await api.post(`/users/${targetUser.userId}/follow`);
      if (res.data?.code === 0) {
        const newStatus = res.data.data?.isFollowing;
        toast.success(newStatus ? `${targetUser.nickname}님을 팔로우했습니다.` : '팔로우를 취소했습니다.');

        setFollowingUsers(prev =>
          prev.map(u => (u.userId === targetUser.userId ? { ...u, isFollowing: newStatus } : u))
        );
        setFollowerUsers(prev =>
          prev.map(u => (u.userId === targetUser.userId ? { ...u, isFollowing: newStatus } : u))
        );
      }
    } catch (err) {
      const msg = err.response?.data?.message || '팔로우 처리에 실패했습니다.';
      toast.error(msg);
    } finally {
      setTogglingId(null);
    }
  };

  if (loading && savedItems.length === 0) {
    return (
      <div className="v2-root bg-background min-h-screen flex items-center justify-center">
        <div className="text-primary font-bold">로딩 중...</div>
      </div>
    );
  }

  const displayedFollowUsers = followSubTab === 'followings' ? followingUsers : followerUsers;

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
          <img src="/apple-touch-icon.png" alt="Icon" className="w-6 h-6 object-contain" />
          <h1 className="text-[#695E34] font-['Plus_Jakarta_Sans'] font-semibold text-lg tracking-tight">나의 사전</h1>
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

      <main className="flex-1 pt-20 pb-32 px-4 space-y-5 max-w-2xl mx-auto w-full">
        {/* Main Tabs: 내 사전 기록 / 팔로우한 사전 */}
        <div className="flex gap-2 bg-surface-container-low p-1.5 rounded-3xl">
          <button
            type="button"
            onClick={() => handleMainTabChange('saved')}
            className={`flex-1 py-3 rounded-[1.25rem] font-bold text-sm transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'saved'
                ? 'bg-primary text-background soy-shadow'
                : 'text-tertiary hover:bg-surface-container-high'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">menu_book</span>
            <span>내 사전 기록</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-black ${
              activeTab === 'saved' ? 'bg-background/20 text-background' : 'bg-surface-container-high text-primary'
            }`}>
              {savedItems.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => handleMainTabChange('follow')}
            className={`flex-1 py-3 rounded-[1.25rem] font-bold text-sm transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'follow'
                ? 'bg-primary text-background soy-shadow'
                : 'text-tertiary hover:bg-surface-container-high'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">group</span>
            <span>팔로우한 사전</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-black ${
              activeTab === 'follow' ? 'bg-background/20 text-background' : 'bg-surface-container-high text-primary'
            }`}>
              {followingUsers.filter(u => u.isFollowing !== false).length}
            </span>
          </button>
        </div>

        {/* Tab 1: 내 사전 기록 */}
        {activeTab === 'saved' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {error && (
              <div className="p-4 rounded-2xl bg-error-container/40 text-error text-sm font-bold text-center">
                {error}
              </div>
            )}

            {savedItems.length > 0 ? (
              savedItems.map((item) => {
                const beanTypes = item.restaurant.beanTypes?.length ? item.restaurant.beanTypes : [item.restaurant.beanType].filter(Boolean);
                let noodleImg = "/apple-touch-icon.png";
                if (beanTypes.includes('BLACK_BEAN')) {
                  noodleImg = "/images/black bean noodle.png";
                } else if (beanTypes.includes('SOY_BEAN')) {
                  noodleImg = "/images/soy bean noodle.png";
                }

                return (
                  <div 
                    key={item.id}
                    onClick={() => navigate(`/v2/restaurant/${item.restaurant.id}`)}
                    className="bg-surface-container-lowest p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow cursor-pointer relative group flex gap-4 items-start"
                  >
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt="콩국수 인증샷"
                        className="w-16 h-16 rounded-xl object-cover shrink-0 shadow-xs border border-outline-variant/15"
                      />
                    ) : item.isImageBlinded ? (
                      <div 
                        className="w-16 h-16 rounded-xl bg-error-container/40 border border-error/20 flex flex-col items-center justify-center shrink-0 p-1 text-center"
                        title={`블라인드 사유: ${item.imageBlindReason || '관련 없는 사진'}`}
                      >
                        <span className="material-symbols-outlined text-error text-xl">visibility_off</span>
                        <span className="text-[9px] text-error font-semibold mt-0.5 leading-none">사진 블라인드</span>
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-primary-container flex items-center justify-center shrink-0">
                        <img src={noodleImg} alt="Noodles" className="w-10 h-10 object-contain" />
                      </div>
                    )}
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
                        {item.restaurant.servesAllYear && (
                          <span className="bg-amber-100 text-amber-900 border border-amber-300 px-3 py-1 rounded-full text-[11px] font-bold flex items-center gap-1">
                            👑 개념업소
                          </span>
                        )}
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
                        {item.isImageBlinded && (
                          <div className="mt-1.5 text-xs text-error bg-error-container/40 px-2.5 py-1.5 rounded-lg border border-error/20 flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[16px] shrink-0">info</span>
                            <span>등록하신 인증 사진이 블라인드 처리되었습니다 ({item.imageBlindReason || '관련 없는 사진'}).</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
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
          </div>
        )}

        {/* Tab 2: 팔로우한 사전 (팔로잉 / 팔로워) */}
        {activeTab === 'follow' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Sub-tabs: 팔로잉 / 팔로워 */}
            <div className="flex items-center justify-between px-1">
              <div className="inline-flex gap-1.5 bg-surface-container-lowest p-1 rounded-2xl border border-outline-variant/15">
                <button
                  type="button"
                  onClick={() => handleSubTabChange('followings')}
                  className={`px-4 py-1.5 rounded-xl text-xs font-black transition-all ${
                    followSubTab === 'followings'
                      ? 'bg-secondary-container text-on-secondary-container shadow-2xs'
                      : 'text-tertiary hover:text-primary'
                  }`}
                >
                  내가 팔로우한 유저 ({followingUsers.filter(u => u.isFollowing !== false).length})
                </button>
                <button
                  type="button"
                  onClick={() => handleSubTabChange('followers')}
                  className={`px-4 py-1.5 rounded-xl text-xs font-black transition-all ${
                    followSubTab === 'followers'
                      ? 'bg-secondary-container text-on-secondary-container shadow-2xs'
                      : 'text-tertiary hover:text-primary'
                  }`}
                >
                  나를 팔로우한 유저 ({followerUsers.length})
                </button>
              </div>
            </div>

            {followLoading ? (
              <div className="py-20 text-center text-sm text-primary font-bold">
                목록을 불러오는 중...
              </div>
            ) : displayedFollowUsers.length > 0 ? (
              <div className="space-y-3">
                {displayedFollowUsers.map((u) => {
                  const badge = getSeasoningBadge(u.seasoningPreference);
                  return (
                    <div
                      key={u.userId}
                      onClick={() => navigate(`/v2/users/${u.userId}/dictionary`)}
                      className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/15 shadow-xs hover:shadow-md transition-all flex items-center justify-between gap-3 cursor-pointer group"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <V2UserAvatar
                          size={48}
                          src={u.profileImageUrl}
                          seed={u.avatarSeed}
                          name={u.nickname}
                          variant={u.avatarVariant || 'beam'}
                        />
                        <div className="min-w-0 text-left">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-black text-base text-primary truncate group-hover:text-primary/80 transition-colors">
                              {u.nickname}
                            </span>
                            {badge && (
                              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black border shrink-0 ${badge.color}`}>
                                {badge.label}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-tertiary font-semibold mt-1">
                            <span className="material-symbols-outlined text-[15px] text-primary/70">menu_book</span>
                            <span>기록한 콩국수 사전 <strong className="text-primary">{u.visitedCount || 0}</strong>곳</span>
                            <span className="text-outline/50">·</span>
                            <span className="text-primary/80 group-hover:underline">사전 열람 &gt;</span>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={togglingId === u.userId}
                        onClick={(e) => handleToggleFollow(e, u)}
                        className={`px-4 py-2 rounded-full text-xs font-black shrink-0 transition-all active:scale-95 flex items-center gap-1 ${
                          u.isFollowing
                            ? 'bg-surface-container text-primary border border-outline-variant/40 hover:bg-surface-container-high'
                            : 'bg-primary text-background shadow-xs hover:opacity-90'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[15px]">
                          {u.isFollowing ? 'how_to_reg' : 'person_add'}
                        </span>
                        <span>{u.isFollowing ? '팔로잉' : '팔로우'}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 px-6 text-center space-y-3 bg-surface-container-lowest rounded-3xl border border-outline-variant/10">
                <span className="material-symbols-outlined text-5xl text-tertiary/25">person_search</span>
                <p className="text-primary font-bold text-base">
                  {followSubTab === 'followings'
                    ? '아직 팔로우한 유저가 없습니다.'
                    : '아직 나를 팔로우한 유저가 없습니다.'}
                </p>
                <p className="text-tertiary text-xs leading-relaxed max-w-xs">
                  {followSubTab === 'followings'
                    ? '식당 상세 페이지의 방문 노트·댓글이나 메인 화면의 최근 리뷰에서 마음에 드는 미식가를 눌러 팔로우해 보세요!'
                    : '콩국수 맛집 방문 노트를 남기면 다른 미식가들이 회원님의 사전을 구경하고 팔로우할 수 있어요.'}
                </p>
                <button
                  type="button"
                  onClick={() => navigate('/v2')}
                  className="mt-2 bg-primary text-background px-6 py-2.5 rounded-full text-sm font-bold active:scale-95 transition-all shadow-lg shadow-primary/20"
                >
                  콩국수 맛집 둘러보기
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer Nav */}
      <nav className="fixed bottom-0 left-0 w-full flex justify-around items-center px-4 pb-6 pt-3 bg-[#FDF9ED]/80 backdrop-blur-xl z-50 rounded-t-xl shadow-[0_-20px_40px_rgba(105,94,52,0.08)]">
        <FooterItem icon="leaderboard" label="랭킹" onClick={() => navigate('/v2/ranking')} />
        <FooterItem icon="dictionary" label="목록" onClick={() => navigate('/v2?view=list')} />
        <FooterItem icon="map" label="지도" onClick={() => navigate('/v2?view=map')} />
        <FooterItem active={true} icon="bookmark" label="나의 사전" onClick={() => {}} />
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
