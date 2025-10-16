import React from "react";
import KakaoMap from "./KakaoMap";
import { Link } from "react-router-dom";
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';
import SearchInput from "./SearchInput";

function RestaurantMapAndList({ restaurants, handleFilterChange, filter, loading, error }) {

  const handlePriceChange = (values) => {
    handleFilterChange("minPrice", values[0]);
    handleFilterChange("maxPrice", values[1]);
  };

  if (loading) {
    return <p className="text-center mt-8 text-lg font-semibold text-gray-700">🔍 콩국수 맛집을 찾고 있어요...</p>;
  }

  if (error) {
    return <p className="text-center mt-8 text-red-500">❌ {error}</p>;
  }

  const displayRestaurants = restaurants || [];

  return (
    <>
      <div className="flex justify-center my-4 px-4">
        <SearchInput
          searchTerm={filter.searchTerm}
          handleFilterChange={handleFilterChange}
        />

      </div>

      <div className="flex justify-center my-4">
        <KakaoMap restaurants={displayRestaurants} /> {/* 수정된 변수 사용 */}
      </div>

      {/* 필터 메뉴 디자인 개선 및 가격 슬라이더 적용 */}
      <div className="bg-white p-6 rounded-xl shadow-lg mx-4 mb-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4 text-center">✨ 콩국수 필터 ✨</h3>

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
            range
            min={5000}
            max={20000}
            step={1000}
            value={[filter.minPrice, filter.maxPrice]}
            onChange={handlePriceChange}
            trackStyle={[{ backgroundColor: '#FCD34D' }, { backgroundColor: '#FCD34D' }]}
            handleStyle={[{ borderColor: '#D97706', backgroundColor: '#F59E0B' }, { borderColor: '#D97706', backgroundColor: '#F59E0B' }]}
            railStyle={{ backgroundColor: '#E2E8F0' }}
          />
        </div>
      </div>

      <div className="mx-4 mt-4">
        {displayRestaurants.length > 0 ? (
          displayRestaurants.map((restaurant) => (
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
