import React, { useState, useEffect } from "react";

function SearchInput({ searchTerm, handleFilterChange }) {
  // 부모의 filter.searchTerm으로 로컬 상태 초기화
  const [localValue, setLocalValue] = useState(searchTerm);

  // 부모의 searchTerm이 외부에서 변경되면 로컬 상태도 동기화 (예: 필터 초기화)
  useEffect(() => {
    // 부모로부터 받은 검색어와 로컬 값이 다를 경우에만 업데이트
    if (searchTerm !== localValue) {
      setLocalValue(searchTerm);
    }
  }, [searchTerm]);

  const handleChange = (e) => {
    // 키 입력 시에는 로컬 상태만 업데이트 (UI에 즉시 반영)
    setLocalValue(e.target.value);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault(); // 폼 전송 방지
      // Enter 키가 눌렸을 때만 부모의 filter.searchTerm을 최종 값으로 업데이트
      handleFilterChange("searchTerm", localValue);
    }
  };

  return (
    <input
      type="text"
      value={localValue}
      onChange={handleChange} // 로컬 값 업데이트
      onKeyDown={handleKeyDown} // Enter 키로 검색 실행
      placeholder="🍜 식당 이름 또는 주소로 검색 (Enter)" // placeholder 수정
      className="p-3 border border-gray-300 rounded-lg w-full max-w-md focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-lg"
    />
  );
}

export default React.memo(SearchInput);
