import React from "react";

export default function Home() {
  return (
    <div className="bg-[#FCEBB6] min-h-screen flex flex-col items-center p-4">
      {/* 타이틀 */}
      <h1 className="text-4xl font-bold text-[#5C5C5C] drop-shadow-lg mb-6">
        🍜 콩국수 사전
      </h1>

      {/* 네비게이션 바 */}
      <nav className="w-full max-w-md bg-white p-3 rounded-2xl shadow-md flex justify-around mb-6">
        <button className="text-lg font-semibold text-[#5C5C5C] hover:scale-110 transition">
          📍 지도
        </button>
        <button className="text-lg font-semibold text-[#5C5C5C] hover:scale-110 transition">
          📝 후기
        </button>
        <button className="text-lg font-semibold text-[#5C5C5C] hover:scale-110 transition">
          💬 채팅
        </button>
      </nav>

      {/* 식당 리스트 */}
      <div className="grid grid-cols-1 gap-4 w-full max-w-md">
        {/* 예제 식당 카드 */}
        <div className="bg-white p-4 rounded-2xl shadow-md flex flex-col items-center">
          <img
            src="https://source.unsplash.com/200x150/?noodles"
            alt="콩국수"
            className="rounded-lg mb-3"
          />
          <h2 className="text-2xl font-bold text-[#5C5C5C]">국수명가 🍜</h2>
          <p className="text-sm text-gray-600">사계절 운영 | 검은콩 🌑</p>
          <button className="mt-2 px-4 py-2 bg-[#5C5C5C] text-white rounded-xl shadow-md hover:bg-gray-800 transition">
            자세히 보기 🔍
          </button>
        </div>
      </div>
    </div>
  );
}
