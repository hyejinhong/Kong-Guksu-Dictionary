import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import './V2Main.css';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';

const V2FindIdPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [showNoEmailModal, setShowNoEmailModal] = useState(false);
  const navigate = useNavigate();

  const handleFindId = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const url = `${API_BASE_URL}/auth/find-username`;
      const response = await axios.post(url, { email });

      if (response.data && response.data.code === 0 && response.data.data) {
        setResult(response.data.data);
        toast.success('아이디를 찾았습니다!');
      } else {
        toast.error(response.data?.message || '일치하는 사용자 정보를 찾을 수 없습니다.');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || '등록된 이메일을 찾을 수 없거나 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="v2-root bg-background flex flex-col items-center justify-center px-6 min-h-screen">
      <div className="w-full max-w-md space-y-8 py-8">
        <div className="text-center">
          <img src="/apple-touch-icon.png" alt="Logo" className="w-20 h-20 mx-auto mb-4 object-contain animate-bounce-slow" />
          <h1 className="text-4xl font-black text-primary tracking-tighter font-headline mb-2">
            아이디 찾기
          </h1>
          <p className="text-on-surface-variant font-medium">
            가입 시 등록하신 이메일 주소를 입력해 주세요.
          </p>
        </div>

        {!result ? (
          <form onSubmit={handleFindId} className="mt-8 space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-outline uppercase ml-4">이메일</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-6 py-4 rounded-3xl bg-surface-container border-none focus:ring-2 focus:ring-secondary text-on-surface font-bold placeholder-outline-variant"
                placeholder="example@email.com"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 mt-6 rounded-3xl bg-primary text-background font-black text-lg soy-shadow active:scale-95 transition-all disabled:opacity-50"
            >
              {loading ? '조회 중...' : '아이디 찾기'}
            </button>
          </form>
        ) : (
          <div className="mt-8 p-6 bg-surface-container rounded-3xl text-center space-y-4 shadow-sm border border-outline/10">
            <span className="material-symbols-outlined text-primary text-5xl">badge</span>
            <div>
              <p className="text-xs font-bold text-outline uppercase mb-1">찾으신 아이디</p>
              <p className="text-2xl font-black text-primary tracking-wider font-headline">
                {result.maskedUsername}
              </p>
              {result.registeredAt && (
                <p className="text-xs text-outline font-medium mt-2">
                  가입일: {result.registeredAt}
                </p>
              )}
            </div>
            <div className="pt-2 space-y-2">
              <button
                onClick={() => navigate('/v2/login')}
                className="w-full py-3 rounded-3xl bg-primary text-background font-black transition-all active:scale-95"
              >
                로그인하러 가기
              </button>
              <button
                onClick={() => navigate('/v2/forgot-password')}
                className="w-full py-3 rounded-3xl bg-surface-container-high text-on-surface font-bold text-sm transition-all hover:bg-surface-variant"
              >
                비밀번호 찾기
              </button>
            </div>
          </div>
        )}

        {/* 이메일 미등록 회원 안내 블록 */}
        <div className="mt-6 p-5 rounded-3xl bg-surface-container-low border border-outline/10 text-center space-y-2">
          <p className="text-xs font-bold text-on-surface-variant">
            이메일을 등록하지 않은 기존 회원이신가요?
          </p>
          <button
            type="button"
            onClick={() => setShowNoEmailModal(true)}
            className="text-xs font-black text-secondary hover:underline transition-colors"
          >
            기존 회원 아이디 찾기 안내
          </button>
        </div>

        <div className="text-center pt-2">
          <Link 
            to="/v2/login" 
            className="text-secondary font-bold text-sm hover:underline"
          >
            로그인 화면으로 돌아가기
          </Link>
        </div>
      </div>

      {/* 이메일 미등록 회원 안내 모달 */}
      {showNoEmailModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-xl border border-outline/20 animate-fade-in">
            <span className="material-symbols-outlined text-secondary text-4xl">help_outline</span>
            <h3 className="text-lg font-black text-on-surface">기존 회원 아이디 찾기</h3>
            <p className="text-xs text-on-surface-variant leading-relaxed text-left">
              이메일 도입 이전에 가입하셔서 이메일이 등록되지 않은 분은 가입 시 작성하신 <strong>닉네임</strong>을 포함하여 
              아래 지원 채널로 문의해주시면 즉시 본인 확인 후 아이디 안내를 도와드립니다.
            </p>
            <div className="p-3 bg-surface-container rounded-2xl text-xs font-mono font-bold text-primary select-all">
              kong.dictionary@gmail.com
            </div>
            <button
              onClick={() => setShowNoEmailModal(false)}
              className="w-full py-3 rounded-2xl bg-primary text-background font-bold text-sm transition-all active:scale-95"
            >
              확인
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default V2FindIdPage;
