import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import './V2Main.css';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';

const V2SignupPage = () => {
  const [formData, setFormData] = useState({
    username: '',
    nickname: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [isGeneratingNickname, setIsGeneratingNickname] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const generateRandomNickname = async () => {
    if (isGeneratingNickname) return;
    setIsGeneratingNickname(true);

    try {
      const url = `${API_BASE_URL}/users/nickname/random`;
      const response = await axios.get(url);

      if (response.data && response.data.code === 0 && response.data.data) {
        setFormData((prev) => ({ ...prev, nickname: response.data.data }));
        toast.success('새로운 닉네임이 생성되었습니다!');
      } else {
        toast.error('닉네임 생성에 실패했습니다.');
      }
    } catch (error) {
      toast.error('서버와의 통신 중 오류가 발생했습니다.');
    } finally {
      setIsGeneratingNickname(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = `${API_BASE_URL}/auth/signup`;
      const response = await axios.post(url, {
        username: formData.username,
        password: formData.password,
        nickname: formData.nickname,
      });

      if (response.data && response.data.code === 0) {
        toast.success('회원가입에 성공했습니다! 로그인해주세요.');
        navigate('/v2/login');
      } else {
        toast.error(response.data?.message || '회원가입에 실패했습니다.');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || '서버와의 통신 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="v2-root bg-background flex flex-col items-center justify-center px-6 py-12 overflow-y-auto">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-black text-primary tracking-tighter font-headline mb-2">
            반가워요!
          </h1>
          <p className="text-on-surface-variant font-medium text-sm">콩국수사전의 회원이 되어보세요</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-bold text-outline uppercase ml-4">아이디</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className="w-full px-6 py-4 rounded-3xl bg-surface-container border-none focus:ring-2 focus:ring-secondary text-on-surface font-bold placeholder-outline-variant transition-all"
              placeholder="아이디를 입력하세요"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-outline uppercase ml-4">닉네임</label>
            <div className="relative">
              <input
                type="text"
                name="nickname"
                value={formData.nickname}
                onChange={handleChange}
                className="w-full px-6 py-4 rounded-3xl bg-surface-container border-none focus:ring-2 focus:ring-secondary text-on-surface font-bold placeholder-outline-variant transition-all"
                placeholder="닉네임을 입력하거나 생성하세요"
                required
              />
              <button
                type="button"
                onClick={generateRandomNickname}
                disabled={isGeneratingNickname}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-secondary text-white text-[10px] font-black px-4 py-2.5 rounded-full hover:bg-secondary/90 active:scale-95 transition-all disabled:opacity-50"
              >
                {isGeneratingNickname ? '생성 중...' : '랜덤 생성'}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-outline uppercase ml-4">비밀번호</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-6 py-4 rounded-3xl bg-surface-container border-none focus:ring-2 focus:ring-secondary text-on-surface font-bold placeholder-outline-variant transition-all"
              placeholder="비밀번호를 입력하세요"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 mt-6 rounded-3xl bg-primary text-background font-black text-lg soy-shadow active:scale-95 transition-all disabled:opacity-50"
          >
            {loading ? '가입 중...' : '회원가입 완료'}
          </button>
        </form>

        <div className="text-center pt-4">
          <p className="text-sm text-outline font-medium">
            이미 계정이 있으신가요?{' '}
            <Link to="/v2/login" className="text-secondary font-bold hover:underline">
              로그인하기
            </Link>
          </p>
        </div>

        <div className="pt-8 flex justify-center pb-8">
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

export default V2SignupPage;
