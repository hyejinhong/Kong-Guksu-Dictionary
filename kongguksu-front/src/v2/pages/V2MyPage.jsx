import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api';
import './V2Main.css';
import { useNotification } from '../contexts/NotificationContext';

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

const getBeanLabel = (beanType) => {
  if (beanType === 'SOY_BEAN') return '백태';
  if (beanType === 'BLACK_BEAN') return '서리태';
  return beanType || '기타';
};

const V2MyPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { unread, openModal } = useNotification();

  const [activeTab, setActiveTab] = useState('profile'); // 'profile' or 'comments'
  const [loading, setLoading] = useState(true);
  
  // Profile state
  const [formData, setFormData] = useState({
    username: '',
    nickname: '',
    currentPassword: '',
    newPassword: '',
    email: '',
  });

  const [emailInput, setEmailInput] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerificationSent, setIsVerificationSent] = useState(false);
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [sendingVerification, setSendingVerification] = useState(false);
  const [verifyingEmail, setVerifyingEmail] = useState(false);

  // Comments state
  const [myComments, setMyComments] = useState([]);
  const [commentPage, setCommentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Submissions state
  const [mySubmissions, setMySubmissions] = useState([]);

  const fetchUserProfile = useCallback(async () => {
    try {
      const response = await api.get('/users/me');
      const userData = response.data?.data;
      if (userData) {
        setFormData(prev => ({
          ...prev,
          username: userData.username,
          nickname: userData.nickname || '',
          email: userData.email || '',
        }));
        setEmailInput(userData.email || '');
        if (!userData.email) {
          setIsEditingEmail(true);
        } else {
          setIsEditingEmail(false);
        }
      }
    } catch (err) {
      console.error('Failed to fetch profile:', err);
      toast.error('프로필 정보를 불러오지 못했습니다.');
    } finally {
      if (activeTab === 'profile') setLoading(false);
    }
  }, [activeTab]);

  const fetchMyComments = useCallback(async (page) => {
    try {
      const response = await api.get('/users/me/comments', {
        params: { page, size: 5 }
      });
      const pageData = response.data?.data;
      if (pageData) {
        setMyComments(pageData.content || []);
        setTotalPages(pageData.totalPages || 0);
        setTotalElements(pageData.totalElements || 0);
      }
    } catch (err) {
      console.error('Failed to fetch comments:', err);
      toast.error('댓글 목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMySubmissions = useCallback(async () => {
    try {
      const response = await api.get('/users/me/submissions');
      if (response.data?.data) {
        setMySubmissions(response.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch submissions:', err);
      toast.error('제보 내역을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isLoggedIn()) {
      navigate(`/v2/login?redirect=${encodeURIComponent(location.pathname)}`);
      return;
    }

    setLoading(true);
    if (activeTab === 'profile') {
      fetchUserProfile();
    } else if (activeTab === 'comments') {
      fetchMyComments(commentPage);
    } else if (activeTab === 'submissions') {
      fetchMySubmissions();
    }
  }, [activeTab, commentPage, fetchUserProfile, fetchMyComments, fetchMySubmissions, navigate, location.pathname]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSendVerificationCode = async () => {
    if (!emailInput || !emailInput.includes('@')) {
      toast.error('올바른 이메일 주소를 입력해주세요.');
      return;
    }
    setSendingVerification(true);
    try {
      const response = await api.post('/users/email/verification-request', { email: emailInput });
      if (response.data?.code === 0) {
        toast.success('인증 코드가 이메일로 전송되었습니다.');
        setIsVerificationSent(true);
      } else {
        toast.error(response.data?.message || '인증 코드 발송에 실패했습니다.');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || '이미 등록된 이메일이거나 발송 오류가 발생했습니다.');
    } finally {
      setSendingVerification(false);
    }
  };

  const handleVerifyAndRegisterEmail = async () => {
    if (!verificationCode) {
      toast.error('인증 코드를 입력해주세요.');
      return;
    }
    setVerifyingEmail(true);
    try {
      const response = await api.post('/users/email/verify-and-register', {
        email: emailInput,
        code: verificationCode
      });
      if (response.data?.code === 0) {
        toast.success('이메일이 성공적으로 등록되었습니다.');
        const updatedUser = response.data.data;
        setFormData(prev => ({ ...prev, email: updatedUser.email }));
        setIsVerificationSent(false);
        setVerificationCode('');
        setIsEditingEmail(false);
      } else {
        toast.error(response.data?.message || '인증에 실패했습니다.');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || '인증 코드가 유효하지 않거나 만료되었습니다.');
    } finally {
      setVerifyingEmail(false);
    }
  };

  const handleRandomNickname = async () => {
    try {
      const response = await api.get('/users/nickname/random');
      if (response.data?.data) {
        setFormData(prev => ({ ...prev, nickname: response.data.data }));
      }
    } catch (err) {
      toast.error('랜덤 닉네임을 가져오지 못했습니다.');
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (formData.newPassword && !formData.currentPassword) {
      toast.error('비밀번호 변경을 위해 현재 비밀번호를 입력해주세요.');
      return;
    }

    try {
      const payload = {
        nickname: formData.nickname,
        currentPassword: formData.currentPassword || null,
        newPassword: formData.newPassword || null,
      };

      const response = await api.patch('/users/me', payload);
      if (response.data?.code === 0) {
        toast.success('정보가 수정되었습니다.');
        setFormData(prev => ({ ...prev, currentPassword: '', newPassword: '' }));
      } else {
        toast.error(response.data?.message || '수정에 실패했습니다.');
      }
    } catch (err) {
      toast.error('정보 수정 중 오류가 발생했습니다.');
    }
  };

  const handleDeleteComment = async (restaurantId, commentId) => {
    if (!window.confirm('댓글을 삭제하시겠습니까?')) return;

    try {
      await api.delete(`/restaurants/${restaurantId}/comments/${commentId}`);
      toast.success('삭제되었습니다.');
      fetchMyComments(commentPage);
    } catch (err) {
      toast.error('삭제에 실패했습니다.');
    }
  };

  const handleLogout = async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      try {
        await api.post('/auth/logout', { refreshToken });
      } catch (error) {
        console.error('Logout failed:', error);
      }
    }
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('exp');
    localStorage.removeItem('role');
    navigate('/v2');
    toast.success('로그아웃 되었습니다.');
  };

  if (loading && activeTab === 'profile' && !formData.username) {
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
          onClick={() => navigate('/v2')}
          className="text-[#695E34] hover:bg-[#FCEBB6]/20 transition-colors active:scale-95 duration-200 p-2 rounded-full"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div className="flex items-center gap-2">
          <img src="/apple-touch-icon.png" alt="Icon" className="w-6 h-6 object-contain" />
          <h1 className="text-[#695E34] font-['Plus_Jakarta_Sans'] font-semibold text-lg tracking-tight">내 정보</h1>
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

      <main className="flex-1 pt-24 pb-32 px-6 max-w-2xl mx-auto w-full">
        {/* Tabs */}
        <div className="flex gap-2 mb-8 bg-surface-container-low p-1.5 rounded-3xl">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex-1 py-3 rounded-[1.25rem] font-bold text-sm transition-all ${
              activeTab === 'profile'
                ? 'bg-primary text-background soy-shadow'
                : 'text-tertiary hover:bg-surface-container-high'
            }`}
          >
            프로필 수정
          </button>
          <button
            onClick={() => {
              setActiveTab('comments');
              setCommentPage(0);
            }}
            className={`flex-1 py-3 rounded-[1.25rem] font-bold text-sm transition-all ${
              activeTab === 'comments'
                ? 'bg-primary text-background soy-shadow'
                : 'text-tertiary hover:bg-surface-container-high'
            }`}
          >
            내가 쓴 댓글
          </button>
          <button
            onClick={() => setActiveTab('submissions')}
            className={`flex-1 py-3 rounded-[1.25rem] font-bold text-sm transition-all ${
              activeTab === 'submissions'
                ? 'bg-primary text-background soy-shadow'
                : 'text-tertiary hover:bg-surface-container-high'
            }`}
          >
            제보 내역
          </button>
        </div>

        {activeTab === 'profile' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 text-center">
            {/* ... (profile content) ... */}
            <div className="py-4">
              <div className="w-24 h-24 bg-primary-container rounded-full mx-auto flex items-center justify-center mb-4 soy-shadow">
                <img src="/apple-touch-icon.png" alt="Profile" className="w-14 h-14 object-contain" />
              </div>
              <h2 className="text-2xl font-black text-primary">{formData.nickname}님</h2>
              <p className="text-sm text-outline font-bold">오늘도 맛있는 콩국수 어떠신가요?</p>
            </div>

            <form onSubmit={handleProfileSubmit} className="space-y-6 text-left">
              <div className="space-y-2">
                <label className="text-xs font-bold text-outline uppercase ml-4">아이디 (변경 불가)</label>
                <input
                  type="text"
                  value={formData.username}
                  readOnly
                  className="w-full px-6 py-4 rounded-3xl bg-surface-container text-outline font-bold cursor-not-allowed border-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-outline uppercase ml-4">이메일</label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    disabled={!isEditingEmail || isVerificationSent}
                    className={`flex-1 px-6 py-4 rounded-3xl border-none focus:ring-2 focus:ring-secondary text-on-surface font-bold ${
                      !isEditingEmail ? 'bg-surface-container text-outline cursor-not-allowed' : 'bg-surface-container'
                    }`}
                    placeholder="이메일을 입력하세요"
                    required
                  />
                  {!isEditingEmail ? (
                    <button
                      type="button"
                      onClick={() => setIsEditingEmail(true)}
                      className="px-5 rounded-3xl bg-secondary text-white font-bold text-xs active:scale-95 transition-all"
                    >
                      변경
                    </button>
                  ) : (
                    !isVerificationSent && (
                      <button
                        type="button"
                        onClick={handleSendVerificationCode}
                        disabled={sendingVerification}
                        className="px-5 rounded-3xl bg-primary text-background font-bold text-xs active:scale-95 transition-all disabled:opacity-50"
                      >
                        {sendingVerification ? '전송 중' : '인증 요청'}
                      </button>
                    )
                  )}
                </div>
              </div>

              {isEditingEmail && isVerificationSent && (
                <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <label className="text-xs font-bold text-secondary uppercase ml-4">인증 번호 입력</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      className="flex-1 px-6 py-4 rounded-3xl bg-surface-container border-none focus:ring-2 focus:ring-secondary text-on-surface font-bold"
                      placeholder="6자리 인증 번호를 입력하세요"
                      required
                    />
                    <button
                      type="button"
                      onClick={handleVerifyAndRegisterEmail}
                      disabled={verifyingEmail}
                      className="px-5 rounded-3xl bg-secondary text-white font-bold text-xs active:scale-95 transition-all disabled:opacity-50"
                    >
                      {verifyingEmail ? '확인 중' : '인증 완료'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsVerificationSent(false);
                        setVerificationCode('');
                      }}
                      className="px-3 rounded-3xl bg-surface-container-highest text-on-surface-variant font-bold text-xs active:scale-95 transition-all"
                    >
                      취소
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs font-bold text-outline uppercase ml-4">닉네임</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    name="nickname"
                    value={formData.nickname}
                    onChange={handleInputChange}
                    className="flex-1 px-6 py-4 rounded-3xl bg-surface-container border-none focus:ring-2 focus:ring-secondary text-on-surface font-bold"
                    placeholder="닉네임을 입력하세요"
                    required
                  />
                  <button
                    type="button"
                    onClick={handleRandomNickname}
                    className="px-5 rounded-3xl bg-secondary-container text-on-secondary-container font-bold text-xs active:scale-95 transition-all"
                  >
                    랜덤
                  </button>
                </div>
              </div>

              <div className="pt-4 space-y-4">
                <h3 className="text-sm font-bold text-primary ml-4">비밀번호 변경</h3>
                <div className="space-y-4 bg-surface-container-low p-6 rounded-[2rem]">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-outline uppercase ml-2">현재 비밀번호</label>
                    <input
                      type="password"
                      name="currentPassword"
                      value={formData.currentPassword}
                      onChange={handleInputChange}
                      className="w-full px-5 py-3 rounded-2xl bg-surface-container-lowest border-none focus:ring-2 focus:ring-secondary text-on-surface font-bold text-sm"
                      placeholder="현재 비밀번호"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-outline uppercase ml-2">새 비밀번호</label>
                    <input
                      type="password"
                      name="newPassword"
                      value={formData.newPassword}
                      onChange={handleInputChange}
                      className="w-full px-5 py-3 rounded-2xl bg-surface-container-lowest border-none focus:ring-2 focus:ring-secondary text-on-surface font-bold text-sm"
                      placeholder="새 비밀번호"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-4 mt-4 rounded-3xl bg-primary text-background font-black text-lg soy-shadow active:scale-95 transition-all"
              >
                정보 저장하기
              </button>
            </form>

            <button
              onClick={handleLogout}
              className="w-full py-4 rounded-3xl bg-surface-container-highest text-on-surface-variant font-bold active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-lg">logout</span>
              로그아웃
            </button>

            {/* Credits Section */}
            <div className="pt-12 pb-4 opacity-40">
              <p className="text-[10px] font-medium text-tertiary">
                Bean Icons created by <span className="font-bold">imaginationlol</span> - Flaticon
              </p>
            </div>
          </div>
        )}

        {activeTab === 'comments' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="px-4 flex justify-between items-center">
              <span className="text-sm font-bold text-tertiary">총 {totalElements}개</span>
            </div>

            {loading ? (
              <div className="text-center py-20 text-primary font-bold">댓글을 불러오는 중...</div>
            ) : myComments.length > 0 ? (
              <>
                <div className="space-y-4">
                  {myComments.map((comment) => (
                    <div 
                      key={comment.id || comment.commentId}
                      className="bg-surface-container-lowest p-6 rounded-[2rem] shadow-sm border border-surface-container"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 
                            className="font-black text-primary hover:underline cursor-pointer"
                            onClick={() => navigate(`/v2/restaurant/${comment.restaurantId}`)}
                          >
                            {comment.restaurantName || '알 수 없는 식당'}
                          </h4>
                          <span className="text-[10px] text-outline font-bold uppercase tracking-wider">
                            {new Date(comment.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <button
                          onClick={() => handleDeleteComment(comment.restaurantId, comment.id || comment.commentId)}
                          className="w-8 h-8 flex items-center justify-center text-error/40 hover:text-error hover:bg-error/10 rounded-full transition-colors"
                        >
                          <span className="material-symbols-outlined text-xl">delete</span>
                        </button>
                      </div>
                      <p className="text-on-surface text-sm leading-relaxed whitespace-pre-wrap">
                        {comment.content}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-4 mt-8">
                    <button
                      onClick={() => setCommentPage(prev => Math.max(0, prev - 1))}
                      disabled={commentPage === 0}
                      className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-primary disabled:opacity-30 active:scale-90 transition-all"
                    >
                      <span className="material-symbols-outlined">chevron_left</span>
                    </button>
                    <span className="text-sm font-black text-primary">{commentPage + 1} / {totalPages}</span>
                    <button
                      onClick={() => setCommentPage(prev => Math.min(totalPages - 1, prev + 1))}
                      disabled={commentPage >= totalPages - 1}
                      className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-primary disabled:opacity-30 active:scale-90 transition-all"
                    >
                      <span className="material-symbols-outlined">chevron_right</span>
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                <span className="material-symbols-outlined text-6xl text-tertiary/20">chat_bubble</span>
                <p className="text-tertiary font-medium">아직 작성한 댓글이 없습니다.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'submissions' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="px-4 flex justify-between items-center">
              <span className="text-sm font-bold text-tertiary">총 {mySubmissions.length}개</span>
            </div>

            {loading ? (
              <div className="text-center py-20 text-primary font-bold">제보 내역을 불러오는 중...</div>
            ) : mySubmissions.length > 0 ? (
              <div className="space-y-4">
                {mySubmissions.map((sub) => {
                  const status = sub.status?.toUpperCase();
                  const isApproved = status === 'APPROVED';
                  const rid = sub.restaurantId || sub.restaurant_id;
                  const canNavigate = isApproved && rid;

                  return (
                    <div 
                      key={sub.id}
                      onClick={() => canNavigate && navigate(`/v2/restaurant/${rid}`)}
                      className={`bg-surface-container-lowest p-6 rounded-[2rem] shadow-sm border border-surface-container transition-all ${
                        canNavigate ? 'cursor-pointer hover:scale-[1.02] active:scale-95 hover:shadow-md' : ''
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <h4 className="font-black text-primary text-lg">{sub.name}</h4>
                          {canNavigate && (
                            <span className="material-symbols-outlined text-primary text-sm opacity-50">arrow_forward_ios</span>
                          )}
                        </div>
                        <SubmissionStatusBadge status={sub.status} />
                      </div>
                      <p className="text-outline text-xs font-bold mb-3 flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">location_on</span>
                        {sub.address}
                      </p>
                      
                      <div className="flex flex-wrap gap-2 mt-4">
                        {sub.prices?.map((p, idx) => (
                          <span key={idx} className="px-3 py-1 bg-surface-container rounded-full text-[10px] font-black text-secondary">
                            {getBeanLabel(p.beanType)}: {p.price.toLocaleString()}원
                          </span>
                        ))}
                      </div>

                      {status === 'REJECTED' && sub.rejectReason && (
                        <div className="mt-4 p-3.5 bg-[#C96868]/5 rounded-2xl border border-[#C96868]/15 flex items-start gap-2.5">
                          <span className="material-symbols-outlined text-[#C96868] text-[18px] shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>error</span>
                          <div className="min-w-0">
                            <span className="text-[10px] font-black text-[#C96868] uppercase tracking-wider block">거절 사유</span>
                            <p className="text-[#695E34] text-xs font-bold mt-0.5 leading-relaxed">{sub.rejectReason}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                <span className="material-symbols-outlined text-6xl text-tertiary/20">restaurant</span>
                <p className="text-tertiary font-medium">아직 제보한 식당이 없습니다.</p>
                <button
                  onClick={() => navigate('/v2/submission')}
                  className="px-6 py-3 bg-primary text-background rounded-full font-bold text-sm active:scale-95 transition-all"
                >
                  식당 제보하러 가기
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 w-full flex justify-around items-center px-4 pb-6 pt-3 bg-[#FDF9ED]/80 backdrop-blur-xl z-50 rounded-t-xl shadow-[0_-20px_40px_rgba(105,94,52,0.08)]">
        <FooterItem icon="leaderboard" label="랭킹" onClick={() => navigate('/v2/ranking')} />
        <FooterItem icon="dictionary" label="목록" onClick={() => navigate('/v2?view=list')} />
        <FooterItem icon="map" label="지도" onClick={() => navigate('/v2?view=map')} />
        <FooterItem icon="bookmark" label="저장" onClick={() => navigate('/v2/saved')} />
        <FooterItem active={true} icon="person" label="내 정보" onClick={() => {}} />
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

const SubmissionStatusBadge = ({ status }) => {
  const statusConfig = {
    PENDING: { label: '검토 중', color: 'bg-amber-100 text-amber-700' },
    APPROVED: { label: '승인됨', color: 'bg-emerald-100 text-emerald-700' },
    REJECTED: { label: '반려됨', color: 'bg-rose-100 text-rose-700' },
  };

  const config = statusConfig[status] || statusConfig.PENDING;

  return (
    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${config.color}`}>
      {config.label}
    </span>
  );
};

export default V2MyPage;
