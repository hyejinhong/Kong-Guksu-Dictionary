import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import './V2Main.css';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';

const V2LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = `${API_BASE_URL}/login`;
      const response = await axios.post(url, { username, password });

      if (response.data && response.data.code === 0 && response.data.data?.token) {
        const { token, exp } = response.data.data;
        localStorage.setItem('token', token);
        localStorage.setItem('exp', exp);

        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          localStorage.setItem('role', payload.role);
        } catch (decodeError) {
          console.error('Token decoding failed:', decodeError);
        }

        toast.success('로그인에 성공했습니다!');
        navigate('/v2');
      } else {
        toast.error(response.data?.message || '로그인에 실패했습니다.');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || '서버와의 통신 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="v2-root bg-background flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-black text-primary tracking-tighter font-headline mb-2">
            콩국수사전
          </h1>
          <p className="text-on-surface-variant font-medium">다시 만나서 반가워요!</p>
        </div>

        <form onSubmit={handleLogin} className="mt-8 space-y-4">
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
            <label className="text-xs font-bold text-outline uppercase ml-4">비밀번호</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-6 py-4 rounded-3xl bg-surface-container border-none focus:ring-2 focus:ring-secondary text-on-surface font-bold placeholder-outline-variant"
              placeholder="비밀번호를 입력하세요"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 mt-4 rounded-3xl bg-primary text-background font-black text-lg soy-shadow active:scale-95 transition-all disabled:opacity-50"
          >
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>

        <div className="text-center pt-4">
          <p className="text-sm text-outline font-medium">
            계정이 없으신가요?{' '}
            <Link to="/v2/signup" className="text-secondary font-bold hover:underline">
              회원가입하기
            </Link>
          </p>
        </div>

        <div className="pt-8 flex justify-center">
          <button
            onClick={() => navigate('/v2')}
            className="text-outline-variant hover:text-outline font-bold flex items-center gap-2 transition-colors"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            홈으로 돌아가기
          </button>
        </div>
      </div>
    </div>
  );
};

export default V2LoginPage;
