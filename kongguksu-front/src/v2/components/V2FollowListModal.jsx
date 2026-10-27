import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import V2UserAvatar from './V2UserAvatar';
import api from '../api';

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

const V2FollowListModal = ({
  isOpen,
  onClose,
  userId,
  initialTab = 'followings',
  nickname = '',
  onFollowChange,
}) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [togglingId, setTogglingId] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  const fetchFollowList = useCallback(async () => {
    if (!isOpen) return;
    const targetId = userId || 'me';
    setLoading(true);
    try {
      const endpoint = activeTab === 'followers'
        ? `/users/${targetId}/followers?page=0&size=50`
        : `/users/${targetId}/followings?page=0&size=50`;
      const res = await api.get(endpoint);
      if (res.data?.code === 0) {
        const list = res.data.data?.content || res.data.data || [];
        setUsers(list);
      }
    } catch (err) {
      console.error('Failed to fetch follow list:', err);
      toast.error('목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, [isOpen, userId, activeTab]);

  useEffect(() => {
    fetchFollowList();
  }, [fetchFollowList]);

  if (!isOpen) return null;

  const handleToggleFollow = async (e, targetUser) => {
    e.stopPropagation();
    if (!isLoggedIn()) {
      toast.error('로그인이 필요한 기능입니다.');
      onClose();
      navigate('/v2/login');
      return;
    }

    setTogglingId(targetUser.userId);
    try {
      const res = await api.post(`/users/${targetUser.userId}/follow`);
      if (res.data?.code === 0) {
        const newStatus = res.data.data?.isFollowing;
        setUsers(prev =>
          prev.map(u =>
            u.userId === targetUser.userId ? { ...u, isFollowing: newStatus } : u
          )
        );
        if (onFollowChange) {
          onFollowChange();
        }
      }
    } catch (err) {
      const msg = err.response?.data?.message || '팔로우 처리에 실패했습니다.';
      toast.error(msg);
    } finally {
      setTogglingId(null);
    }
  };

  const handleUserClick = (targetUserId) => {
    onClose();
    navigate(`/v2/users/${targetUserId}/dictionary`);
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-[#695E34]/35 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-md bg-[#FDF9ED] rounded-[2.5rem] shadow-[0_20px_50px_rgba(105,94,52,0.25)] border border-[#EBE4C9] overflow-hidden flex flex-col max-h-[80vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 pt-6 pb-3 flex justify-between items-center border-b border-[#EBE4C9]">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#695E34] text-2xl">group</span>
            <h2 className="text-[#695E34] font-['Plus_Jakarta_Sans'] font-black text-lg truncate max-w-[240px]">
              {nickname ? `${nickname}님의 콩국수 친구` : '팔로우 목록'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#695E34]/60 hover:text-[#695E34] hover:bg-[#695E34]/5 transition-all"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="px-6 pt-3 pb-2 bg-[#FDF9ED]">
          <div className="flex gap-2 bg-surface-container-low p-1 rounded-2xl">
            <button
              type="button"
              onClick={() => setActiveTab('followings')}
              className={`flex-1 py-2 rounded-xl font-bold text-xs transition-all ${
                activeTab === 'followings'
                  ? 'bg-primary text-background shadow-xs'
                  : 'text-tertiary hover:bg-surface-container'
              }`}
            >
              팔로잉
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('followers')}
              className={`flex-1 py-2 rounded-xl font-bold text-xs transition-all ${
                activeTab === 'followers'
                  ? 'bg-primary text-background shadow-xs'
                  : 'text-tertiary hover:bg-surface-container'
              }`}
            >
              팔로워
            </button>
          </div>
        </div>

        {/* User List */}
        <div className="flex-1 overflow-y-auto px-6 py-3 space-y-2.5">
          {loading ? (
            <div className="py-16 text-center text-sm text-tertiary font-bold">
              불러오는 중...
            </div>
          ) : users.length > 0 ? (
            users.map(u => {
              const badge = getSeasoningBadge(u.seasoningPreference);
              return (
                <div
                  key={u.userId}
                  onClick={() => handleUserClick(u.userId)}
                  className="bg-white p-3.5 rounded-2xl border border-[#EBE4C9]/60 shadow-xs hover:shadow-md transition-all flex items-center justify-between gap-3 cursor-pointer group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <V2UserAvatar
                      size={42}
                      src={u.profileImageUrl}
                      seed={u.avatarSeed}
                      name={u.nickname}
                      variant={u.avatarVariant || 'beam'}
                    />
                    <div className="min-w-0 text-left">
                      <div className="flex items-center gap-1.5">
                        <span className="font-black text-sm text-primary truncate group-hover:text-primary/80">
                          {u.nickname}
                        </span>
                        {badge && (
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border shrink-0 ${badge.color}`}>
                            {badge.label}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-tertiary font-semibold mt-0.5">
                        기록한 콩국수 사전 {u.visitedCount || 0}곳
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={togglingId === u.userId}
                    onClick={(e) => handleToggleFollow(e, u)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-black shrink-0 transition-all active:scale-95 ${
                      u.isFollowing
                        ? 'bg-surface-container text-primary border border-outline-variant/40 hover:bg-surface-container-high'
                        : 'bg-primary text-background shadow-xs hover:opacity-90'
                    }`}
                  >
                    {u.isFollowing ? '팔로잉' : '팔로우'}
                  </button>
                </div>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center py-14 text-center space-y-2">
              <span className="material-symbols-outlined text-4xl text-[#695E34]/25">person_search</span>
              <p className="text-[#695E34]/60 font-bold text-sm">
                {activeTab === 'followers' ? '아직 팔로워가 없습니다.' : '아직 팔로우한 유저가 없습니다.'}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-[#F5EFE0] border-t border-[#EBE4C9] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="bg-[#695E34] hover:bg-[#534A29] text-white font-black text-xs px-6 py-2 rounded-full active:scale-95 transition-transform"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};

export default V2FollowListModal;
