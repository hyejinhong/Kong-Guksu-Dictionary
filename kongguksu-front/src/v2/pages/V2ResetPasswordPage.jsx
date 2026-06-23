import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import './V2Main.css';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';

const V2ResetPasswordPage = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // URL에서 token 쿼리 매개변수 추출
  const searchParams = new URLSearchParams(location.search);
  const token = searchParams.get('token');

  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (!token) {
      toast.error('유효하지 않은 접근입니다. 토큰이 존재하지 않습니다.');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('비밀번호가 일치하지 않습니다.');
      return;
    }

    setLoading(true);

    try {
      const url = `${API_BASE_URL}/auth/reset-password/confirm`;
      const response = await axios.post(url, {
        token,
        newPassword
      });

      if (response.data && response.data.code === 0) {
        toast.success('비밀번호가 성공적으로 변경되었습니다. 다시 로그인해주세요!');
        navigate('/v2/login');
      } else {
        toast.error(response.data?.message || '비밀번호 변경에 실패했습니다.');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || '토큰이 만료되었거나 올바르지 않습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="v2-root bg-background flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <img src="/images/noodles.png" alt="Logo" className="w-20 h-20 mx-auto mb-4 object-contain animate-bounce-slow" />
          <h1 className="text-4xl font-black text-primary tracking-tighter font-headline mb-2">
            새 비밀번호 설정
          </h1>
          <p className="text-on-surface-variant font-medium">
            새로 변경할 비밀번호를 입력해 주십시오.
          </p>
        </div>

        {!token ? (
          <div className="mt-8 p-6 bg-surface-container rounded-3xl text-center space-y-4">
            <span className="material-symbols-outlined text-error text-5xl">warning</span>
            <p className="text-on-surface font-bold text-error">
              유효하지 않거나 잘못된 접근입니다.
            </p>
            <p className="text-xs text-outline font-medium">
              비밀번호 재설정 메일의 링크를 다시 확인하시거나, 재설정 요청을 새로 해주십시오.
            </p>
            <button
              onClick={() => navigate('/v2/forgot-password')}
              className="w-full py-3 mt-4 rounded-3xl bg-primary text-background font-black transition-all active:scale-95"
            >
              재설정 메일 요청하러 가기
            </button>
          </div>
        ) : (
          <form onSubmit={handleResetPassword} className="mt-8 space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-outline uppercase ml-4">새 비밀번호</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-6 py-4 rounded-3xl bg-surface-container border-none focus:ring-2 focus:ring-secondary text-on-surface font-bold placeholder-outline-variant"
                placeholder="새 비밀번호를 입력하세요"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-outline uppercase ml-4">비밀번호 확인</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-6 py-4 rounded-3xl bg-surface-container border-none focus:ring-2 focus:ring-secondary text-on-surface font-bold placeholder-outline-variant"
                placeholder="비밀번호를 한번 더 입력하세요"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 mt-6 rounded-3xl bg-primary text-background font-black text-lg soy-shadow active:scale-95 transition-all disabled:opacity-50"
            >
              {loading ? '변경 중...' : '비밀번호 변경 완료'}
            </button>
          </form>
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

export default V2ResetPasswordPage;
