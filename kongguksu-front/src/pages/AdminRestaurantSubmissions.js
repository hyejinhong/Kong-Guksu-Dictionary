import React, { useState, useEffect } from "react";
import axios from "axios";

const AdminRestaurantSubmissions = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 3;

  const getAuthHeader = () => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_API_BASE_URL}/restaurants/submissions`,
          { headers: getAuthHeader() } // ✅ 헤더 추가
        );
        setSubmissions(response.data.data || []);
      } catch (error) {
        console.error("❌ 데이터 불러오기 실패:", error);
        alert("데이터를 불러오는 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissions();
  }, []);

  const handleApprove = async (submissionId) => {
    try {
      const response = await axios.patch(
        `${process.env.REACT_APP_API_BASE_URL}/restaurants/submissions/${submissionId}/approve`,
        {}, // 요청 본문 (필요 없으면 빈 객체)
        { headers: getAuthHeader() } // ✅ 헤더 추가
      );
      if (response.data.code === 0) {
        setSubmissions(prevSubmissions =>
          prevSubmissions.map(sub =>
            sub.id === submissionId ? { ...sub, status: "APPROVED" } : sub
          )
        );
        alert(`"${submissions.find(sub => sub.id === submissionId)?.name}" 요청을 승인했습니다.`);
      } else {
        alert(`승인 실패: ${response.data.message}`);
      }
    } catch (error) {
      console.error("❌ 승인 실패:", error);
      alert("승인 처리 중 오류가 발생했습니다.");
    }
  };

  const handleReject = async (submissionId) => {
    try {
      const response = await axios.patch(
        `${process.env.REACT_APP_API_BASE_URL}/restaurants/submissions/${submissionId}/reject`,
        { headers: getAuthHeader() } // ✅ 헤더 추가
      );
      if (response.data.code === 0) {
        setSubmissions(prevSubmissions => prevSubmissions.filter(sub => sub.id !== submissionId));
        alert(`"${submissions.find(sub => sub.id === submissionId)?.name}" 요청을 거절했습니다.`);
      } else {
        alert(`거절 실패: ${response.data.message}`);
      }
    } catch (error) {
      console.error("❌ 거절 실패:", error);
      alert("거절 처리 중 오류가 발생했습니다.");
    }
  };

  const sortedSubmissions = [...submissions].sort((a, b) => {
    if (a.status === "PENDING" && b.status !== "PENDING") return -1;
    if (b.status === "PENDING" && a.status !== "PENDING") return 1;
    return 0;
  });

  const totalPages = Math.ceil(sortedSubmissions.length / itemsPerPage);
  const paginatedSubmissions = sortedSubmissions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (loading) {
    return <p className="text-center text-gray-600">로딩 중...</p>;
  }

  return (
    <div className="p-6 bg-[#FCEBB6] min-h-screen">
      <h1 className="text-2xl font-bold mb-4 text-center text-[#5C5C5C]">📌 식당 등록 요청 목록</h1>

      <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg p-4">
        {paginatedSubmissions.map((submission, index) => (
          <div key={index} className="border-b last:border-0 p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-lg font-semibold">{submission.name}</p>
                <p className="text-gray-500 text-sm">{submission.address}</p>
                <p className="text-gray-600">
                  {submission.beanTypes && submission.beanTypes.join(", ")} |{" "}
                  {submission.servesAllYear
                    ? "연중무휴"
                    : `${submission.startMonth}월 ~ ${submission.endMonth}월`}
                </p>
                <p className={`font-bold mt-1 ${submission.status === "PENDING" ? "text-yellow-500" : submission.status === "APPROVED" ? "text-green-500" : "text-red-500"}`}>
                  {submission.status === "PENDING" ? "⏳ 대기 중" : submission.status === "APPROVED" ? "✅ 승인됨" : "❌ 거절됨"}
                </p>
              </div>

              {submission.status === "PENDING" && (
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleApprove(submission.id)}
                    className="bg-green-500 text-white px-3 py-1 rounded-md text-sm"
                  >
                    승인
                  </button>
                  <button
                    onClick={() => handleReject(submission.id)}
                    className="bg-red-500 text-white px-3 py-1 rounded-md text-sm"
                  >
                    거절
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-center mt-4">
        <button
          className={`px-4 py-2 mx-2 rounded ${currentPage === 1 ? "bg-gray-300" : "bg-[#5C5C5C] text-white"}`}
          onClick={() => setCurrentPage(currentPage - 1)}
          disabled={currentPage === 1}
        >
          ◀ 이전
        </button>
        <span className="px-4 py-2 bg-white shadow-md rounded text-[#5C5C5C]">
          {currentPage} / {totalPages}
        </span>
        <button
          className={`px-4 py-2 mx-2 rounded ${currentPage === totalPages ? "bg-gray-300" : "bg-[#5C5C5C] text-white"}`}
          onClick={() => setCurrentPage(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          다음 ▶
        </button>
      </div>
    </div>
  );
};

export default AdminRestaurantSubmissions;