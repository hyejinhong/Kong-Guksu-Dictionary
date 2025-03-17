import React, { useState, useEffect } from "react";

const AdminRestaurantSubmissions = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 3;

  useEffect(() => {
    setTimeout(() => {
      setSubmissions([
        { id: 1, name: "콩국수 맛집 A", address: "서울 강남구 테헤란로 123", beanTypes: ["백태콩"], servesAllYear: true, status: "PENDING", submittedAt: "2025-03-17 10:30" },
        { id: 2, name: "여름 콩국수 전문점 B", address: "서울 마포구 홍대입구 45", beanTypes: ["검은콩"], servesAllYear: false, startMonth: 6, endMonth: 9, status: "PENDING", submittedAt: "2025-03-16 15:45" },
        { id: 3, name: "콩콩식당", address: "부산 해운대구 해변로 77", beanTypes: ["백태콩", "검은콩"], servesAllYear: false, startMonth: 5, endMonth: 8, status: "APPROVED", submittedAt: "2025-03-15 14:20" },
        { id: 4, name: "사계절콩국수집", address: "대구 중구 동성로 90", beanTypes: ["백태콩"], servesAllYear: true, status: "REJECTED", submittedAt: "2025-03-14 18:10" },
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  // 정렬 (대기 중인 요청을 오래된 순으로 우선)
  const sortedSubmissions = [...submissions].sort((a, b) => {
    if (a.status === "PENDING" && b.status !== "PENDING") return -1;
    if (b.status === "PENDING" && a.status !== "PENDING") return 1;
    return new Date(a.submittedAt) - new Date(b.submittedAt);
  });

  // 페이징 처리
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
        {paginatedSubmissions.map((submission) => (
          <div key={submission.id} className="border-b last:border-0 p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-lg font-semibold">{submission.name}</p>
                <p className="text-gray-500 text-sm">{submission.address}</p>
                <p className="text-gray-600">
                  {submission.beanTypes.join(", ")} |{" "}
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
                  <button className="bg-green-500 text-white px-3 py-1 rounded-md text-sm">
                    승인
                  </button>
                  <button className="bg-red-500 text-white px-3 py-1 rounded-md text-sm">
                    거절
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* 페이징 네비게이션 */}
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
