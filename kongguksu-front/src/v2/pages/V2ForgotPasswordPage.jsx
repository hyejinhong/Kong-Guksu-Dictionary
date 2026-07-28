import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import './V2Main.css';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';

const V2ForgotPasswordPage = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const navigate = useNavigate();

  const handleRequestReset = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = `${API_BASE_URL}/auth/reset-password/request`;
      const response = await axios.post(url, { username, email });

      if (response.data && response.data.code === 0) {
        toast.success('비밀번호 재설정 이메일이 발송되었습니다.');
        setSubmitted(true);
      } else {
        toast.error(response.data?.message || '이메일 발송에 실패했습니다.');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || '일치하는 사용자 정보를 찾을 수 없거나 서버 통신 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="v2-root bg-background flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <img src="/apple-touch-icon.png" alt="Logo" className="w-20 h-20 mx-auto mb-4 object-contain animate-bounce-slow" />
          <h1 className="text-4xl font-black text-primary tracking-tighter font-headline mb-2">
            비밀번호 찾기
          </h1>
          <p className="text-on-surface-variant font-medium">
            가입할 때 입력하신 아이디와 이메일을 적어주세요.
          </p>
        </div>

        {!submitted ? (
          <form onSubmit={handleRequestReset} className="mt-8 space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-outline uppercase ml-4">아이디</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-6 py-4 rounded-3xl bg-surface-container border-none focus:ring-2 focus:ring-secondary text-on-surface font-bold placeholder-outline-variant"
                placeholder="아이디를 입력하세요"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-outline uppercase ml-4">이메일</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-6 py-4 rounded-3xl bg-surface-container border-none focus:ring-2 focus:ring-secondary text-on-surface font-bold placeholder-outline-variant"
                placeholder="가입 시 등록한 이메일을 입력하세요"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 mt-6 rounded-3xl bg-primary text-background font-black text-lg soy-shadow active:scale-95 transition-all disabled:opacity-50"
            >
              {loading ? '메일 전송 중...' : '재설정 메일 발송'}
            </button>
          </form>
        ) : (
          <div className="mt-8 p-6 bg-surface-container rounded-3xl text-center space-y-4">
            <span className="material-symbols-outlined text-secondary text-5xl">mail</span>
            <p className="text-on-surface font-bold">
              비밀번호 재설정 메일이 성공적으로 발송되었습니다!
            </p>
            <p className="text-xs text-outline font-medium">
              이메일 보관함을 확인하여 재설정 링크를 클릭해 주십시오.<br/>
              (링크는 15분간만 유효합니다.)
            </p>
            <button
              onClick={() => navigate('/v2/login')}
              className="w-full py-3 mt-4 rounded-3xl bg-primary text-background font-black transition-all active:scale-95"
            >
              로그인 화면으로
            </button>
          </div>
        )}

        <div className="text-center pt-4">
          <Link 
            to="/v2/login" 
            className="text-secondary font-bold text-sm hover:underline"
          >
            로그인 화면으로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  );
};

export default V2ForgotPasswordPage;
