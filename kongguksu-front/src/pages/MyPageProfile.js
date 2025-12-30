// kongguksu-front/src/pages/MyPageProfile.js
import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';

const MyPageProfile = () => {
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState('profile');
    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [formData, setFormData] = useState({
        username: "",
        nickname: "",
        currentPassword: "", // 비밀번호 변경 시 현재 비밀번호 확인용
        newPassword: "",     // 새 비밀번호
    });

    // 댓글 관련 상태
    const [myComments, setMyComments] = useState([]);
    const [commentPage, setCommentPage] = useState(0);     // 현재 페이지 (0부터 시작)
    const [totalPages, setTotalPages] = useState(0);       // 전체 페이지 수
    const [totalElements, setTotalElements] = useState(0); // 전체 댓글 수


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
            if (activeTab == 'profile')
                setLoading(false);
        }
    }, [navigate, activeTab]);

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

    // 랜덤 닉네임
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

    // =================================================================
    // 댓글 관련 로직
    // =================================================================

        // 내 댓글 조회
    const fetchMyComments = useCallback(async (page) => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            // 백엔드: /users/me/comments?page=0&size=5
            const response = await axios.get(`${API_BASE_URL}/users/me/comments`, {
                headers: { Authorization: `Bearer ${token}` },
                params: {
                    page: page,
                    size: 5, // 한 페이지에 5개씩
                    // sort: 'createdAt,desc' // (필요 시)
                }
            });

            // 백엔드 Page 객체 구조에 맞춰 데이터 추출
            // 보통 response.data.data.content 가 리스트, response.data.data.totalPages 가 전체 페이지
            const pageData = response.data?.data; 
            if (pageData) {
                setMyComments(pageData.content || []);
                setTotalPages(pageData.totalPages || 0);
                setTotalElements(pageData.totalElements || 0);
            }
        } catch (err) {
            console.error("❌ 댓글 로드 실패:", err);
            // 댓글 로드 실패는 전체 페이지 에러로 막지 않고, 경고만 표시하거나 빈 리스트 처리
        } finally {
            setLoading(false);
        }
    }, []);

    // 댓글 삭제
    const handleDeleteComment = async (restaurantId, commentId) => {
        if (!window.confirm("정말로 이 댓글을 삭제하시겠습니까?")) return;

        try {
            const token = localStorage.getItem('token');
            // 백엔드 API: DELETE /restaurants/{restaurantId}/comments/{commentId}
            await axios.delete(`${API_BASE_URL}/restaurants/${restaurantId}/comments/${commentId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            alert("댓글이 삭제되었습니다.");
            // 삭제 후 목록 갱신
            fetchMyComments(commentPage);
        } catch (err) {
            console.error("❌ 댓글 삭제 실패:", err);
            if (err.response?.status === 404) {
                alert("이미 삭제되었거나 존재하지 않는 댓글입니다.");
                fetchMyComments(commentPage); // 목록 갱신
            } else {
                alert("댓글 삭제 중 오류가 발생했습니다.");
            }
        }
    };

    // =================================================================
    // useEffect (초기 로딩 및 탭 변경 시 데이터 패치)
    // =================================================================

        useEffect(() => {
        if (activeTab === 'profile') {
            fetchUserProfile();
        } else {
            fetchMyComments(commentPage);
        }
    }, [activeTab, commentPage, fetchUserProfile, fetchMyComments]);

    if (loading) {
        return <div className="text-center p-8">프로필 로드 중...</div>;
    }

    if (error) {
        return <div className="text-center p-8 text-red-500">❌ {error}</div>;
    }

    // =================================================================
    // 렌더링
    // =================================================================


    return (
        <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-6">
            <h1 className="text-3xl font-bold text-gray-800 text-center mb-6">마이페이지</h1>

            {/* 탭 네비게이션 */}
            <div className="flex border-b border-gray-200 mb-6">
                <button
                    className={`flex-1 py-3 text-center font-medium transition-colors duration-200 ${
                        activeTab === 'profile'
                            ? 'border-b-2 border-black text-black'
                            : 'text-gray-500 hover:text-gray-700'
                    }`}
                    onClick={() => setActiveTab('profile')}
                >
                    내 정보 수정
                </button>
                <button
                    className={`flex-1 py-3 text-center font-medium transition-colors duration-200 ${
                        activeTab === 'comments'
                            ? 'border-b-2 border-black text-black'
                            : 'text-gray-500 hover:text-gray-700'
                    }`}
                    onClick={() => {
                        setActiveTab('comments');
                        setCommentPage(0); // 탭 전환 시 1페이지로 초기화
                    }}
                >
                    내가 쓴 댓글
                </button>
            </div>

            {loading ? (
                <div className="text-center p-12 text-gray-500">로딩 중...</div>
            ) : error ? (
                <div className="text-center p-8 text-red-500">❌ {error}</div>
            ) : (
                <>
                    {/* 탭 1: 프로필 수정 폼 */}
                    {activeTab === 'profile' && (
                        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-lg space-y-5">
                            {/* 사용자 이름 */}
                            <div>
                                <label className="block mb-1 font-medium text-gray-700">사용자 이름 (ID)</label>
                                <input type="text" value={formData.username} readOnly
                                    className="w-full border px-3 py-2 rounded bg-gray-100 text-gray-500 cursor-not-allowed" />
                            </div>

                            {/* 닉네임 수정 */}
                            <div>
                                <label className="block mb-1 font-medium text-gray-700">닉네임</label>
                                <div className="flex gap-2">
                                    <input type="text" name="nickname" value={formData.nickname} onChange={handleChange}
                                        className="w-full border px-3 py-2 rounded focus:ring-yellow-500 focus:border-transparent"
                                        placeholder="새 닉네임을 입력하세요" required />
                                    <button
                                        type="button"
                                        onClick={handleRandomNickname}
                                        className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold px-4 py-2 rounded transition-colors duration-200 whitespace-nowrap"
                                    >
                                        랜덤 닉네임
                                    </button>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-gray-200">
                                <h2 className="text-xl font-semibold mb-3">비밀번호 변경 (선택)</h2>
                                <div>
                                    <label className="block mb-1 font-medium text-gray-700">현재 비밀번호</label>
                                    <input type="password" name="currentPassword" value={formData.currentPassword} onChange={handleChange}
                                        className="w-full border px-3 py-2 rounded focus:ring-yellow-500 focus:border-transparent"
                                        placeholder="현재 비밀번호를 입력하세요" />
                                </div>
                                <div className="mt-3">
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
                    )}

                    {/* 탭 2: 내가 쓴 댓글 리스트 */}
                    {activeTab === 'comments' && (
                        <div className="space-y-4">
                            <div className="text-gray-600 mb-2">총 <span className="font-bold text-black">{totalElements}</span>개의 댓글을 작성했습니다.</div>
                            
                            {myComments.length === 0 ? (
                                <div className="text-center py-12 bg-gray-50 rounded-lg text-gray-500">
                                    아직 작성한 댓글이 없습니다.
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {myComments.map((comment) => (
                                        <div key={comment.id} className="bg-white p-5 rounded-xl shadow border border-gray-100 hover:shadow-md transition-shadow">
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="flex flex-col">
                                                    {/* 가게 이름 (가게 상세페이지로 이동 기능 추가 가능) */}
                                                    <span className="text-lg font-bold text-gray-800">
                                                        {comment.restaurantName || "알 수 없는 가게"}
                                                    </span>
                                                    <span className="text-xs text-gray-400">
                                                        {new Date(comment.createdAt).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                {/* 삭제 버튼 */}
                                                <button 
                                                    onClick={() => handleDeleteComment(comment.restaurantId, comment.id)}
                                                    className="text-sm text-red-500 hover:text-red-700 font-medium px-2 py-1 rounded hover:bg-red-50"
                                                >
                                                    삭제
                                                </button>
                                            </div>
                                            <p className="text-gray-700 whitespace-pre-wrap">{comment.content}</p>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* 페이지네이션 버튼 */}
                            {totalPages > 1 && (
                                <div className="flex justify-center gap-4 mt-6">
                                    <button
                                        onClick={() => setCommentPage(prev => Math.max(0, prev - 1))}
                                        disabled={commentPage === 0}
                                        className={`px-4 py-2 rounded ${commentPage === 0 ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-white border border-gray-300 hover:bg-gray-50'}`}
                                    >
                                        이전
                                    </button>
                                    <span className="flex items-center text-gray-600">
                                        {commentPage + 1} / {totalPages}
                                    </span>
                                    <button
                                        onClick={() => setCommentPage(prev => Math.min(totalPages - 1, prev + 1))}
                                        disabled={commentPage >= totalPages - 1}
                                        className={`px-4 py-2 rounded ${commentPage >= totalPages - 1 ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-white border border-gray-300 hover:bg-gray-50'}`}
                                    >
                                        다음
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default MyPageProfile;