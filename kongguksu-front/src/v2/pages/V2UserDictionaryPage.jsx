import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import V2UserAvatar from '../components/V2UserAvatar';
import V2FollowListModal from '../components/V2FollowListModal';
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
  return now < expiryTimeInSeconds;
};

const V2UserDictionaryPage = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { unread, openModal } = useNotification();

  const [profile, setProfile] = useState(null);
  const [visitedItems, setVisitedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [togglingFollow, setTogglingFollow] = useState(false);
  const [enlargedImage, setEnlargedImage] = useState(null);
  const [followModalState, setFollowModalState] = useState({ open: false, tab: 'followers' });

  const fetchUserDictionaryData = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);

    try {
      const [profileRes, visitsRes] = await Promise.all([
        api.get(`/users/${userId}/profile`),
        api.get(`/users/${userId}/visited-restaurants?page=0&size=100`),
      ]);

      if (profileRes.data?.code === 0) {
        setProfile(profileRes.data.data);
      } else {
        setError(profileRes.data?.message || '사용자 정보를 불러올 수 없습니다.');
      }

      if (visitsRes.data?.code === 0) {
        const list = visitsRes.data.data?.content || visitsRes.data.data || [];
        setVisitedItems(list);
      }
    } catch (err) {
      console.error('Failed to fetch user dictionary:', err);
      setError('사용자의 콩국수 사전을 불러오는 데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchUserDictionaryData();
  }, [fetchUserDictionaryData]);

  const handleToggleFollow = async () => {
    if (!isLoggedIn()) {
      toast.error('로그인이 필요한 기능입니다.');
      navigate(`/v2/login?redirect=${encodeURIComponent(location.pathname)}`);
      return;
    }

    if (togglingFollow || !profile) return;
    setTogglingFollow(true);

    try {
      const res = await api.post(`/users/${userId}/follow`);
      if (res.data?.code === 0) {
        const { isFollowing, followerCount, followingCount } = res.data.data;
        setProfile(prev => ({
          ...prev,
          isFollowing,
          followerCount,
          followingCount,
        }));
        toast.success(isFollowing ? `${profile.nickname}님을 팔로우했습니다.` : '팔로우를 취소했습니다.');
      }
    } catch (err) {
      const msg = err.response?.data?.message || '팔로우 처리에 실패했습니다.';
      toast.error(msg);
    } finally {
      setTogglingFollow(false);
    }
  };

  if (loading) {
    return (
      <div className="v2-root bg-background min-h-screen flex items-center justify-center">
        <div className="text-primary font-bold">사전 불러오는 중...</div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="v2-root bg-background min-h-screen flex flex-col items-center justify-center p-6 text-center space-y-4">
        <span className="material-symbols-outlined text-5xl text-tertiary/40">person_off</span>
        <div className="text-primary font-bold">{error || '사용자를 찾을 수 없습니다.'}</div>
        <button
          onClick={() => navigate(-1)}
          className="bg-primary text-background px-6 py-2.5 rounded-full text-sm font-bold active:scale-95 transition-all"
        >
          뒤로 가기
        </button>
      </div>
    );
  }

  const seasoningBadge = getSeasoningBadge(profile.seasoningPreference);

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
        <div className="flex items-center gap-2 min-w-0">
          <img src="/apple-touch-icon.png" alt="Icon" className="w-6 h-6 object-contain shrink-0" />
          <h1 className="text-[#695E34] font-['Plus_Jakarta_Sans'] font-semibold text-lg tracking-tight truncate">
            {profile.nickname}님의 사전
          </h1>
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
        {/* User Profile Header Card */}
        <section className="bg-surface-container-lowest rounded-3xl p-6 shadow-sm border border-outline-variant/15 flex flex-col items-center text-center space-y-4">
          <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center soy-shadow overflow-hidden border-2 border-surface-container">
            <V2UserAvatar
              size={80}
              src={profile.profileImageUrl}
              seed={profile.avatarSeed}
              name={profile.nickname}
              variant={profile.avatarVariant || 'beam'}
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <h2 className="text-2xl font-black text-primary tracking-tight">
                {profile.nickname}
              </h2>
              {seasoningBadge && (
                <span className={`px-3 py-0.5 rounded-full text-xs font-black border ${seasoningBadge.color}`}>
                  {seasoningBadge.label}
                </span>
              )}
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-2 w-full max-w-xs bg-surface-container-low/70 rounded-2xl p-3 border border-outline-variant/10">
            <div className="flex flex-col items-center justify-center">
              <span className="text-lg font-black text-primary">{profile.visitedCount ?? visitedItems.length}</span>
              <span className="text-[11px] font-bold text-tertiary">사전 기록</span>
            </div>
            <button
              type="button"
              onClick={() => setFollowModalState({ open: true, tab: 'followers' })}
              className="flex flex-col items-center justify-center border-x border-outline-variant/20 hover:opacity-75 transition-opacity"
            >
              <span className="text-lg font-black text-primary">{profile.followerCount ?? 0}</span>
              <span className="text-[11px] font-bold text-tertiary">팔로워</span>
            </button>
            <button
              type="button"
              onClick={() => setFollowModalState({ open: true, tab: 'followings' })}
              className="flex flex-col items-center justify-center hover:opacity-75 transition-opacity"
            >
              <span className="text-lg font-black text-primary">{profile.followingCount ?? 0}</span>
              <span className="text-[11px] font-bold text-tertiary">팔로잉</span>
            </button>
          </div>

          {/* Follow / My Dictionary Action Button */}
          <div className="w-full max-w-xs pt-1">
            {profile.isMe ? (
              <button
                type="button"
                onClick={() => navigate('/v2/saved')}
                className="w-full py-3 rounded-full bg-surface-container text-primary font-bold text-sm hover:bg-surface-container-high active:scale-95 transition-all flex items-center justify-center gap-1.5 border border-outline-variant/30"
              >
                <span className="material-symbols-outlined text-[18px]">bookmark</span>
                <span>나의 사전 관리</span>
              </button>
            ) : (
              <button
                type="button"
                disabled={togglingFollow}
                onClick={handleToggleFollow}
                className={`w-full py-3 rounded-full font-bold text-sm active:scale-95 transition-all flex items-center justify-center gap-1.5 ${
                  profile.isFollowing
                    ? 'bg-surface-container text-primary border border-outline-variant/40 hover:bg-surface-container-high'
                    : 'bg-primary text-background shadow-md shadow-primary/20 hover:opacity-95'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">
                  {profile.isFollowing ? 'how_to_reg' : 'person_add'}
                </span>
                <span>{profile.isFollowing ? '팔로잉' : '팔로우'}</span>
              </button>
            )}
          </div>
        </section>

        {/* Section Title */}
        <div className="flex items-center justify-between px-2 pt-1">
          <h3 className="text-primary font-bold text-base flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[20px]">menu_book</span>
            <span>방문한 콩국수집 ({visitedItems.length})</span>
          </h3>
        </div>

        {/* Visited Restaurants List */}
        {visitedItems.length > 0 ? (
          <div className="space-y-3.5">
            {visitedItems.map((item) => {
              const restaurant = item.restaurant || {};
              const beanTypes = restaurant.beanTypes?.length
                ? restaurant.beanTypes
                : [restaurant.beanType].filter(Boolean);
              let noodleImg = '/apple-touch-icon.png';
              if (beanTypes.includes('BLACK_BEAN')) {
                noodleImg = '/images/black bean noodle.png';
              } else if (beanTypes.includes('SOY_BEAN')) {
                noodleImg = '/images/soy bean noodle.png';
              }

              return (
                <div
                  key={item.id}
                  onClick={() => restaurant.id && navigate(`/v2/restaurant/${restaurant.id}`)}
                  className="bg-surface-container-lowest p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow cursor-pointer relative group flex gap-4 items-start border border-outline-variant/10"
                >
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt="콩국수 인증샷"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEnlargedImage(item.imageUrl);
                      }}
                      className="w-16 h-16 rounded-xl object-cover shrink-0 shadow-xs border border-outline-variant/15 hover:scale-105 transition-transform"
                      title="클릭하여 사진 확대"
                    />
                  ) : item.isImageBlinded ? (
                    <div
                      className="w-16 h-16 rounded-xl bg-surface-container-high/60 border border-outline-variant/20 flex flex-col items-center justify-center shrink-0 p-1 text-center"
                      title="관리자에 의해 블라인드 처리된 이미지입니다"
                    >
                      <span className="material-symbols-outlined text-outline text-xl">visibility_off</span>
                      <span className="text-[9px] text-outline font-semibold mt-0.5 leading-none">블라인드</span>
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-primary-container flex items-center justify-center shrink-0">
                      <img src={noodleImg} alt="Noodles" className="w-10 h-10 object-contain" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1 gap-2">
                      <h4 className="text-lg font-bold text-primary group-hover:text-primary/80 transition-colors truncate">
                        {restaurant.name}
                      </h4>
                      <span className="material-symbols-outlined text-tertiary/40 group-hover:text-primary text-[18px] shrink-0">
                        chevron_right
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-tertiary mb-2">
                      <span className="material-symbols-outlined text-[15px]">location_on</span>
                      <span className="truncate">{restaurant.address}</span>
                    </div>

                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {restaurant.servesAllYear && (
                        <span className="bg-amber-100 text-amber-900 border border-amber-300 px-2.5 py-0.5 rounded-full text-[11px] font-bold flex items-center gap-1">
                          👑 개념업소
                        </span>
                      )}
                      {beanTypes.map(bean => (
                        <span
                          key={bean}
                          className="bg-secondary-container/50 text-on-secondary-container px-2.5 py-0.5 rounded-full text-[11px] font-bold"
                        >
                          {getBeanLabel(bean)}
                        </span>
                      ))}
                    </div>

                    {/* Visit Rating & Memo */}
                    <div className="bg-surface-container-low/60 rounded-xl p-3 flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-tertiary font-medium">
                          방문일: {item.visitedDate}
                        </span>
                        <div className="flex text-primary">
                          {[...Array(5)].map((_, i) => (
                            <span
                              key={i}
                              className="material-symbols-outlined text-[14px]"
                              style={{ fontVariationSettings: `'FILL' ${i < (item.rating || 0) ? 1 : 0}` }}
                            >
                              star
                            </span>
                          ))}
                        </div>
                      </div>
                      {item.memo && (
                        <p className="text-xs text-on-surface/85 font-medium mt-1 whitespace-pre-wrap leading-relaxed">
                          "{item.memo}"
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center space-y-3 bg-surface-container-lowest rounded-3xl border border-outline-variant/10">
            <span className="material-symbols-outlined text-5xl text-tertiary/25">bookmark</span>
            <p className="text-tertiary font-medium text-sm">아직 기록된 콩국수 맛집이 없습니다.</p>
          </div>
        )}
      </main>

      {/* Enlarged Image Modal */}
      {enlargedImage && (
        <div
          className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setEnlargedImage(null)}
        >
          <div className="relative max-w-2xl w-full flex flex-col items-center">
            <button
              type="button"
              onClick={() => setEnlargedImage(null)}
              className="self-end mb-3 w-10 h-10 rounded-full bg-white/15 text-white flex items-center justify-center hover:bg-white/25 transition-colors"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
            <img
              src={enlargedImage}
              alt="콩국수 인증샷 원본"
              className="max-h-[80vh] w-auto rounded-2xl object-contain shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}

      {/* Followers / Followings List Modal */}
      <V2FollowListModal
        isOpen={followModalState.open}
        onClose={() => setFollowModalState(prev => ({ ...prev, open: false }))}
        userId={userId}
        initialTab={followModalState.tab}
        nickname={profile.nickname}
        onFollowChange={fetchUserDictionaryData}
      />

      {/* Footer Nav */}
      <nav className="fixed bottom-0 left-0 w-full flex justify-around items-center px-4 pb-6 pt-3 bg-[#FDF9ED]/80 backdrop-blur-xl z-50 rounded-t-xl shadow-[0_-20px_40px_rgba(105,94,52,0.08)]">
        <FooterItem icon="leaderboard" label="랭킹" onClick={() => navigate('/v2/ranking')} />
        <FooterItem icon="dictionary" label="목록" onClick={() => navigate('/v2?view=list')} />
        <FooterItem icon="map" label="지도" onClick={() => navigate('/v2?view=map')} />
        <FooterItem icon="bookmark" label="나의 사전" onClick={() => navigate('/v2/saved')} />
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

export default V2UserDictionaryPage;
