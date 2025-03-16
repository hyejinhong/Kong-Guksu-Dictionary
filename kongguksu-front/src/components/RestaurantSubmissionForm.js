import React, { useState } from "react";
import axios from "axios";

const RestaurantSubmissionForm = () => {
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    beanTypes: [],
    servesAllYear: false,
    startMonth: "",
    endMonth: "",
  });

  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name === "beanTypes") {
      setFormData((prev) => ({
        ...prev,
        beanTypes: checked
          ? [...prev.beanTypes, value]
          : prev.beanTypes.filter((bean) => bean !== value),
      }));
    } else if (type === "checkbox") {
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMessage("");

    // 백엔드 API URL
    const apiUrl = "/restaurant/submissions";

    // 서버로 보낼 데이터 구성
    const submissionData = {
      ...formData,
      startMonth: formData.servesAllYear ? null : formData.startMonth,
      endMonth: formData.servesAllYear ? null : formData.endMonth,
    };

    try {
      const response = await axios.post(apiUrl, submissionData, {
        headers: { "Content-Type": "application/json" },
      });

      if (response.status === 201) {
        setSuccessMessage("🎉 식당 등록 요청이 성공적으로 제출되었습니다!");
        setFormData({
          name: "",
          address: "",
          beanTypes: [],
          servesAllYear: false,
          startMonth: "",
          endMonth: "",
        });
      }
    } catch (error) {
      console.error("등록 요청 실패:", error);
      alert("❌ 등록 요청 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#FCEBB6] p-4">
      <div className="w-full max-w-lg bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-4">
          🍜 식당 등록 요청
        </h2>
        {successMessage && <p className="text-green-600 text-center">{successMessage}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 식당 이름 */}
          <div>
            <label className="block text-gray-700 font-semibold mb-1">식당 이름</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-md"
              required
            />
          </div>

          {/* 주소 입력 */}
          <div>
            <label className="block text-gray-700 font-semibold mb-1">주소</label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-md"
              required
            />
          </div>

          {/* 콩 종류 선택 */}
          <div>
            <label className="block text-gray-700 font-semibold mb-1">콩 종류</label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="beanTypes"
                  value="백태콩"
                  checked={formData.beanTypes.includes("백태콩")}
                  onChange={handleChange}
                  className="mr-2"
                />
                백태콩
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="beanTypes"
                  value="검은콩"
                  checked={formData.beanTypes.includes("검은콩")}
                  onChange={handleChange}
                  className="mr-2"
                />
                검은콩
              </label>
            </div>
          </div>

          {/* 연중 판매 여부 */}
          <div className="flex items-center">
            <input
              type="checkbox"
              name="servesAllYear"
              checked={formData.servesAllYear}
              onChange={handleChange}
              className="mr-2"
            />
            <label className="text-gray-700 font-semibold">연중 판매</label>
          </div>

          {/* 판매 기간 선택 */}
          {!formData.servesAllYear && (
            <div className="flex space-x-4">
              <div>
                <label className="block text-gray-700 font-semibold mb-1">시작 월</label>
                <select
                  name="startMonth"
                  value={formData.startMonth}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                >
                  <option value="">선택</option>
                  {[...Array(12)].map((_, i) => (
                    <option key={i} value={i + 1}>
                      {i + 1}월
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-1">종료 월</label>
                <select
                  name="endMonth"
                  value={formData.endMonth}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                >
                  <option value="">선택</option>
                  {[...Array(12)].map((_, i) => (
                    <option key={i} value={i + 1}>
                      {i + 1}월
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* 제출 버튼 */}
          <button
            type="submit"
            className="w-full bg-[#5C5C5C] text-white py-2 rounded-md font-semibold hover:bg-gray-700 transition disabled:opacity-50"
            disabled={loading}
          >
            {loading ? "제출 중..." : "등록 요청 제출"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default RestaurantSubmissionForm;
