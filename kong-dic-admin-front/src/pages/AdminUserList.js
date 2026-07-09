import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";

const ADMIN_API_BASE_URL = process.env.REACT_APP_ADMIN_API_BASE_URL || 'http://localhost:8081';

const AdminUserList = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 모달 관련 상태
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [targetUser, setTargetUser] = useState(null); // { id, username, enabled }

  const getAuthHeader = () => {
    const token = localStorage.getItem("admin_token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${ADMIN_API_BASE_URL}/admin/users`,
        { headers: getAuthHeader() }
      );

      if (response.data && response.data.data) {
        setUsers(response.data.data);
      } else {
        setUsers([]);
      }
    } catch (err) {
      console.error("❌ 유저 목록 불러오기 실패:", err);
      setError("유저 데이터를 불러오는 데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // 상태 변경 실행
  const executeToggleStatus = async (id, currentEnabled) => {
    const nextEnabled = !currentEnabled;
    try {
      await axios.patch(
        `${ADMIN_API_BASE_URL}/admin/users/${id}/status`,
        { enabled: nextEnabled },
        { headers: getAuthHeader() }
      );

      setModalMessage(`유저 "${targetUser.username}"의 상태가 성공적으로 변경되었습니다.`);
      setIsAlertModalOpen(true);
      fetchUsers(); // 목록 갱신
    } catch (error) {
      console.error("❌ 상태 변경 실패:", error);
      const status = error.response?.status;
      let message = "상태 변경 중 오류가 발생했습니다.";
      if (status === 403) {
        message = "권한이 없습니다. (403 Forbidden)";
      }
      setModalMessage(message);
      setIsAlertModalOpen(true);
    } finally {
      setTargetUser(null);
      setIsConfirmModalOpen(false);
    }
  };

  // 비활성화/활성화 클릭 시 확인 모달 띄우기
  const handleToggleStatusClick = (user) => {
    setTargetUser(user);
    const actionText = user.enabled ? "정지(비활성화)" : "활성화";
    setModalMessage(`유저 "${user.username}"(닉네임: ${user.nickname || '없음'}) 계정을 ${actionText} 하시겠습니까?`);
    setIsConfirmModalOpen(true);
  };

  const handleConfirmToggle = () => {
    if (targetUser) {
      executeToggleStatus(targetUser.id, targetUser.enabled);
    }
  };

  const handleAlertClose = () => {
    setIsAlertModalOpen(false);
    setModalMessage('');
  };

  if (loading) {
    return <p className="text-center text-gray-600 mt-8">로딩 중...</p>;
  }

  if (error) {
    return <p className="text-center text-red-500 mt-8">❌ {error}</p>;
  }

  return (
    <div className="p-6 max-w-6xl mx-auto bg-gray-100 min-h-[80vh]">
      <h1 className="text-3xl font-extrabold mb-6 text-gray-800">👤 회원 관리</h1>

      {users.length === 0 ? (
        <div className="bg-white p-8 rounded-lg shadow-lg">
          <p className="text-center text-gray-500">현재 등록된 회원이 없습니다.</p>
        </div>
      ) : (
        <div className="bg-white shadow-xl rounded-lg overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">아이디</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">닉네임</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">이메일</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">권한</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">가입일</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">관리</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-yellow-50/50 transition-colors duration-150">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.username}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.nickname || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.role === "ADMIN" ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800"
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.enabled ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                    }`}>
                      {user.enabled ? "활성" : "정지"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.registeredAt}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                    <button
                      onClick={() => handleToggleStatusClick(user)}
                      className={`px-3 py-1 rounded text-xs font-semibold text-white transition-colors duration-150 ${
                        user.enabled
                          ? "bg-red-500 hover:bg-red-600"
                          : "bg-green-500 hover:bg-green-600"
                      }`}
                    >
                      {user.enabled ? "정지" : "활성화"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Confirmation Modal UI */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 transition-opacity">
          <div className="bg-white p-6 rounded-xl shadow-2xl max-w-sm w-full transform transition-all">
            <h3 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">상태 변경 확인</h3>
            <p className="text-gray-700 mb-6">{modalMessage}</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setIsConfirmModalOpen(false)}
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 font-medium transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleConfirmToggle}
                className={`px-4 py-2 text-white rounded-lg font-medium transition-colors shadow-md ${
                  targetUser?.enabled ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"
                }`}
              >
                변경
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Alert Modal UI */}
      {isAlertModalOpen && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 transition-opacity">
          <div className="bg-white p-6 rounded-xl shadow-2xl max-w-sm w-full transform transition-all">
            <h3 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">알림</h3>
            <p className="text-gray-700 mb-6">{modalMessage}</p>
            <div className="flex justify-end">
              <button
                onClick={handleAlertClose}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors shadow-md"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUserList;
