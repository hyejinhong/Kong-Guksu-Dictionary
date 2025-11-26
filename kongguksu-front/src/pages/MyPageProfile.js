// kongguksu-front/src/pages/MyPageProfile.js
import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';

const MyPageProfile = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [formData, setFormData] = useState({
        username: "",
        nickname: "",
        currentPassword: "", // 비밀번호 변경 시 현재 비밀번호 확인용
        newPassword: "",     // 새 비밀번호
    });

    // 현재 사용자 정보 조회 함수
    const fetchUserProfile = useCallback(async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }

            const response = await axios.get(
                `${API_BASE_URL}/users/me`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            const userData = response.data?.data;
            if (userData) {
                setFormData(prev => ({
                    ...prev,
                    username: userData.username,
                    nickname: userData.nickname || '',
                }));
            }
        } catch (err) {
            console.error("❌ 프로필 로드 실패:", err);
            setError("프로필 정보를 불러오는 데 실패했습니다.");
        } finally {
            setLoading(false);
        }
    }, [navigate]);

    useEffect(() => {
        fetchUserProfile();
    }, [fetchUserProfile]);

    // 입력 필드 변경 핸들러
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    // 수정 제출 핸들러
    const handleSubmit = async (e) => {
        e.preventDefault();

        // 비밀번호 변경 시 유효성 검사
        if (formData.newPassword && !formData.currentPassword) {
            alert("비밀번호를 변경하려면 현재 비밀번호를 입력해야 합니다.");
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const payload = {
                nickname: formData.nickname,
                currentPassword: formData.currentPassword || null,
                newPassword: formData.newPassword || null,
            };

            const response = await axios.patch(`${API_BASE_URL}/users/me`, payload, {
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            });

            if (response.status === 200 && response.data?.code === 0) {
                alert("정보가 성공적으로 수정되었습니다.");
                // 성공 후 비밀번호 필드 초기화
                setFormData(prev => ({ ...prev, currentPassword: '', newPassword: '' }));
            } else {
                alert("수정 실패: " + (response.data?.message || "서버 오류"));
            }
        } catch (err) {
            console.error("수정 오류:", err);
            alert("수정 처리 중 오류가 발생했습니다. (현재 비밀번호 불일치 등)");
        }
    };

    const handleRandomNickname = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_BASE_URL}/users/nickname/random`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const randomNickname = response.data?.data;
            if (randomNickname) {
                // 생성된 랜덤 닉네임을 닉네임 필드에 바로 설정
                setFormData(prev => ({
                    ...prev,
                    nickname: randomNickname,
                }));
            } else {
                alert("랜덤 닉네임을 가져오는 데 실패했습니다.");
            }
        } catch (err) {
            console.error("❌ 랜덤 닉네임 API 호출 실패:", err);
            alert("랜덤 닉네임을 가져오는 중 오류가 발생했습니다.");
        }
    };

    if (loading) {
        return <div className="text-center p-8">프로필 로드 중...</div>;
    }

    if (error) {
        return <div className="text-center p-8 text-red-500">❌ {error}</div>;
    }

    return (
        <div className="p-4 sm:p-6 max-w-lg mx-auto space-y-6">
            <h1 className="text-3xl font-bold text-gray-800 text-center mb-6">내 정보 수정</h1>

            <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-lg space-y-5">
                {/* 사용자 이름 (변경 불가) */}
                <div>
                    <label className="block mb-1 font-medium text-gray-700">사용자 이름 (ID)</label>
                    <input type="text" value={formData.username} readOnly
                        className="w-full border px-3 py-2 rounded bg-gray-100 text-gray-500 cursor-not-allowed" />
                </div>

                {/* 닉네임 수정 */}
                <div>
                    <label className="block mb-1 font-medium text-gray-700">닉네임</label>
                    {/* 필드와 버튼을 감싸는 Flex 컨테이너 */}
                    <div className="flex gap-2">
                        <input type="text" name="nickname" value={formData.nickname} onChange={handleChange}
                            className="w-full border px-3 py-2 rounded focus:ring-yellow-500 focus:border-transparent"
                            placeholder="새 닉네임을 입력하세요" required />
                        <button
                            type="button" // 폼 전송 방지
                            onClick={handleRandomNickname} // 랜덤 닉네임 핸들러 연결
                            className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold px-4 py-2 rounded transition-colors duration-200 whitespace-nowrap"
                        >
                            랜덤 닉네임
                        </button>
                    </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                    <h2 className="text-xl font-semibold mb-3">비밀번호 변경 (선택)</h2>

                    {/* 현재 비밀번호 */}
                    <div>
                        <label className="block mb-1 font-medium text-gray-700">현재 비밀번호</label>
                        <input type="password" name="currentPassword" value={formData.currentPassword} onChange={handleChange}
                            className="w-full border px-3 py-2 rounded focus:ring-yellow-500 focus:border-transparent"
                            placeholder="현재 비밀번호를 입력하세요" />
                    </div>

                    {/* 새 비밀번호 */}
                    <div>
                        <label className="block mb-1 font-medium text-gray-700">새 비밀번호</label>
                        <input type="password" name="newPassword" value={formData.newPassword} onChange={handleChange}
                            className="w-full border px-3 py-2 rounded focus:ring-yellow-500 focus:border-transparent"
                            placeholder="변경할 비밀번호를 입력하세요" />
                    </div>
                </div>

                <button type="submit"
                    className="w-full bg-black text-white px-6 py-3 rounded hover:bg-gray-800 transition-colors duration-200 font-semibold"
                >
                    정보 저장
                </button>
            </form>
        </div>
    );
};
export default MyPageProfile;