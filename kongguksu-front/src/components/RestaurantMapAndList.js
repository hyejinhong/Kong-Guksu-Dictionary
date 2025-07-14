// src/components/RestaurantMapAndList.js
import React from "react";
import KakaoMap from "./KakaoMap";
import { Link } from "react-router-dom";
import Slider from 'rc-slider'; // rc-slider 임포트
import 'rc-slider/assets/index.css'; // rc-slider 기본 CSS 임포트 (전역 CSS에 넣는게 일반적)


function RestaurantMapAndList({ filteredRestaurants, handleFilterChange, filter }) {
  // `handleSearchTermChange`는 이제 `handleFilterChange`를 통해 `searchTerm`을 업데이트합니다.
  const handleSearchTermInput = (e) => {
    handleFilterChange("searchTerm", e.target.value);
  };

  // `rc-slider` 가격대 슬라이더 변경 핸들러
  const handlePriceChange = (values) => { // rc-slider는 [min, max] 배열을 반환
    handleFilterChange("minPrice", values[0]);
    handleFilterChange("maxPrice", values[1]);
  };

  return (
    <>
      <div className="flex justify-center my-4 px-4">
        <input
          type="text"
          placeholder="🍜 식당 이름이나 주소를 검색해보세요"
          className="p-3 border border-gray-300 rounded-lg w-full max-w-md focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-lg"
          value={filter.searchTerm} // filter prop에서 searchTerm 가져오기
          onChange={handleSearchTermInput} // 새로운 핸들러 연결
        />
      </div>

      <div className="flex justify-center my-4">
        <KakaoMap restaurants={filteredRestaurants} />
      </div>

      {/* 필터 메뉴 디자인 개선 및 가격 슬라이더 적용 */}
      <div className="bg-white p-6 rounded-xl shadow-lg mx-4 mb-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4 text-center">✨ 검색 ✨</h3>

        {/* 콩 종류 필터 */}
        <div className="mb-6 border-b pb-4 border-gray-200">
          <p className="text-md font-semibold text-gray-700 mb-2">🌱 콩 종류:</p>
          <div className="flex flex-wrap gap-3">
            {[
              { label: "전체", value: "all" },
              { label: "백태콩", value: "SOY_BEAN" },
              { label: "검은콩", value: "BLACK_BEAN" },
            ].map((option) => (
              <label key={option.value} className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="beanType"
                  value={option.value}
                  checked={filter.beanType === option.value}
                  onChange={() => handleFilterChange("beanType", option.value)}
                  className="form-radio h-5 w-5 text-yellow-600 border-gray-300 focus:ring-yellow-500"
                />
                <span className="ml-2 text-gray-700">{option.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* 판매 기간 필터 */}
        <div className="mb-6 border-b pb-4 border-gray-200">
          <p className="text-md font-semibold text-gray-700 mb-2">🗓️ 판매 기간:</p>
          <div className="flex flex-wrap gap-3">
            {[
              { label: "전체", value: "all" },
              { label: "사계절", value: "always" },
              { label: "현재 개시", value: "open-now" },
            ].map((option) => (
              <label key={option.value} className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="season"
                  value={option.value}
                  checked={filter.season === option.value}
                  onChange={() => handleFilterChange("season", option.value)}
                  className="form-radio h-5 w-5 text-yellow-600 border-gray-300 focus:ring-yellow-500"
                />
                <span className="ml-2 text-gray-700">{option.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* 가격대 슬라이더 (rc-slider 적용) */}
        <div>
          <p className="text-md font-semibold text-gray-700 mb-4">💰 가격대:</p>
          <div className="flex items-center justify-between text-gray-800 text-lg font-medium mb-3">
            <span>{filter.minPrice.toLocaleString()}원</span>
            <span>~</span>
            <span>{filter.maxPrice.toLocaleString()}원</span>
          </div>
          <Slider
            range // 범위 슬라이더로 사용
            min={5000}
            max={20000}
            step={1000} // 1000원 단위로 조절
            value={[filter.minPrice, filter.maxPrice]} // filter prop에서 minPrice, maxPrice 가져오기
            onChange={handlePriceChange} // 새로운 핸들러 연결
            trackStyle={[{ backgroundColor: '#FCD34D' }, { backgroundColor: '#FCD34D' }]}
            handleStyle={[{ borderColor: '#D97706', backgroundColor: '#F59E0B' }, { borderColor: '#D97706', backgroundColor: '#F59E0B' }]}
            railStyle={{ backgroundColor: '#E2E8F0' }}
          />
        </div>
      </div>

      <div className="mx-4 mt-4">
        {filteredRestaurants.length > 0 ? (
          filteredRestaurants.map((restaurant) => (
            <Link key={restaurant.id} to={`/restaurant/${restaurant.id}`} className="block">
              <div className="bg-white p-4 mb-2 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200">
                <p className="font-bold text-xl text-gray-800">{restaurant.name}</p>
                <p className="text-sm text-gray-600">{restaurant.address}</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {restaurant.beanTypes && restaurant.beanTypes.map((type) => (
                    <span key={type} className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                      {type === "SOY_BEAN" ? "백태콩" : type === "BLACK_BEAN" ? "검은콩" : type}
                    </span>
                  ))}
                  <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                    {restaurant.servesAllYear ? "사계절 판매" : `${restaurant.startMonth}월 ~ ${restaurant.endMonth}월`}
                  </span>
                </div>
              </div>
            </Link>
          ))
        ) : (
          <p className="text-center text-gray-500 text-lg py-8">😢 검색 결과가 없습니다.</p>
        )}
      </div>
    </>
  );
}

export default RestaurantMapAndList;