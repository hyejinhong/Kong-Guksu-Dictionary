// src/components/RestaurantMapAndList.js
import React from "react";
import KakaoMap from "./KakaoMap";
import { Link } from "react-router-dom";

function RestaurantMapAndList({ filteredRestaurants, handleFilterChange, filter }) {
  return (
    <>
      <div className="flex justify-center my-4">
        <KakaoMap restaurants={filteredRestaurants} />
      </div>
      {/* 필터 메뉴 */}
      <div className="flex flex-wrap justify-center bg-white p-4 rounded-lg mx-4">
        <div className="flex space-x-4">
          <label className="flex items-center">
            <input
              type="radio"
              name="beanType"
              value="all"
              checked={filter.beanType === "all"}
              onChange={() => handleFilterChange("beanType", "all")}
            />
            <span className="ml-2">전체</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="beanType"
              value="백태콩"
              checked={filter.beanType === "백태콩"}
              onChange={() => handleFilterChange("beanType", "백태콩")}
            />
            <span className="ml-2">백태콩</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="beanType"
              value="검은콩"
              checked={filter.beanType === "검은콩"}
              onChange={() => handleFilterChange("beanType", "검은콩")}
            />
            <span className="ml-2">검은콩</span>
          </label>
        </div>
        <div className="flex space-x-4 mt-2">
          <label className="flex items-center">
            <input
              type="radio"
              name="season"
              value="all"
              checked={filter.season === "all"}
              onChange={() => handleFilterChange("season", "all")}
            />
            <span className="ml-2">전체</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="season"
              value="always"
              checked={filter.season === "always"}
              onChange={() => handleFilterChange("season", "always")}
            />
            <span className="ml-2">사계절</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="season"
              value="open-now"
              checked={filter.season === "open-now"}
              onChange={() => handleFilterChange("season", "open-now")}
            />
            <span className="ml-2">현재 콩국수 개시</span>
          </label>
        </div>
      </div>
      <div className="mx-4 mt-4">
        {filteredRestaurants.map((restaurant) => (
          <Link key={restaurant.id} to={`/restaurant/${restaurant.id}`} className="block">
            <div className="bg-white p-4 mb-2 rounded-lg shadow-md">
              <p className="font-bold text-lg">{restaurant.name}</p>
              <p className="text-sm text-gray-600">{restaurant.address}</p>
              <p className="text-sm">거리: {restaurant.distance?.toFixed(1)}km</p>
              <p className="text-sm">
                콩 종류:
                {restaurant.beanTypes.map((type, index) => (
                  <span key={type}>
                    {type === "SOY_BEAN" ? "백태콩" : type === "BLACK_BEAN" ? "검은콩" : type}
                    {index < restaurant.beanTypes.length - 1 ? " " : ""}
                  </span>
                ))}
              </p>
              <p className="text-sm">
                판매 기간: {restaurant.servesAllYear ? "사계절 판매" : `${restaurant.startMonth}월 ~ ${restaurant.endMonth}월`}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}

export default RestaurantMapAndList;