import React, { useEffect, useState } from "react";
import axios from "axios";

const RestaurantSubmissionForm = () => {
  const [map, setMap] = useState(null);
  const [markers, setMarkers] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    // soyType: "",
    startMonth: "",
    endMonth: "",
    isAllYear: false, // 연중무휴 여부
    latitude: "",
    longitude: "",
    prices: [{ beanType: "", price: "" }],
  });
  // Kakao SDK 로드 함수
  const loadKakaoMapScript = () => {
    return new Promise((resolve, reject) => {
      if (window.kakao && window.kakao.maps) {
        resolve(window.kakao);
        return;
      }

      const script = document.createElement("script");
      script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.REACT_APP_KAKAO_MAP_API_KEY}&autoload=false&libraries=services`;
      script.async = true;
      script.onload = () => {
        window.kakao.maps.load(() => {
          resolve(window.kakao);
        });
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  };

  // 지도 초기화
  useEffect(() => {
    const initMap = async () => {
      try {
        const kakao = await loadKakaoMapScript();
        const container = document.getElementById("map");
        const options = {
          center: new kakao.maps.LatLng(37.5665, 126.9780), // 서울 중심
          level: 5,
          draggable: true, // 드래그 허용
          scrollwheel: true, // 마우스 휠로 확대/축소 허용
        };
        const mapInstance = new kakao.maps.Map(container, options);
        setMap(mapInstance);
      } catch (error) {
        console.error("Kakao Maps 로딩 실패:", error);
      }
    };

    initMap();
  }, []);

  // 가격 입력 필드 변경 처리 핸들러
  const handlePriceItemChange = (index, event) => {
    const { name, value } = event.target;
    const newPrices = [...formData.prices];
    newPrices[index][name] = value;
    setFormData((prev) => ({
      ...prev,
      prices: newPrices,
    }));
  };

  // 가격 입력 필드 추가 핸들러
  const handleAddPriceItem = () => {
    setFormData((prev) => ({
      ...prev,
      prices: [...prev.prices, { beanType: "", price: "" }],
    }));
  };

  // 가격 입력 필드 삭제 핸들러
  const handleRemovePriceItem = (index) => {
    const newPrices = formData.prices.filter((_, i) => i !== index);
    setFormData((prev) => ({
      ...prev,
      prices: newPrices,
    }));
  };


  // 키워드로 검색
  const searchPlaces = () => {
    if (!searchKeyword.trim() || !map) return;

    const ps = new window.kakao.maps.services.Places();
    ps.keywordSearch(searchKeyword, (data, status) => {
      if (status !== window.kakao.maps.services.Status.OK) {
        alert("검색 결과가 없습니다.");
        return;
      }

      // 이전 마커 제거
      markers.forEach((marker) => marker.setMap(null));
      const newMarkers = [];

      const bounds = new window.kakao.maps.LatLngBounds();

      data.forEach((place) => {
        const position = new window.kakao.maps.LatLng(place.y, place.x);
        const marker = new window.kakao.maps.Marker({
          map,
          position,
        });

        window.kakao.maps.event.addListener(marker, "click", () => {
          setFormData({
            ...formData,
            address: place.address_name,
            name: place.place_name,
            latitude: place.y,
            longitude: place.x
          });
        });

        newMarkers.push(marker);
        bounds.extend(position);
      });

      setMarkers(newMarkers);
      map.setBounds(bounds);

      map.setZoomable(true);
      map.setDraggable(true);
    });
  };

  // 엔터키로 검색
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      searchPlaces();
    }
  };

  // 입력 변경 처리
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: formData.name,
        address: formData.address,
        // beanTypes: formData.soyType ? [formData.soyType] : [],
        servesAllYear: formData.isAllYear,
        startMonth: formData.isAllYear ? 0 : parseInt(formData.startMonth),
        endMonth: formData.isAllYear ? 0 : parseInt(formData.endMonth),
        latitude: formData.latitude,
        longitude: formData.longitude,
        prices: formData.prices.map(item => ({
          beanType: item.beanType,
          price: parseInt(item.price),
        })).filter(item => item.beanType && item.price),
      };

      const token = localStorage.getItem('token');

      const res = await axios.post(`${API_BASE_URL}/restaurants/submissions`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });
      if (res.data.code === 0) {
        alert("제출되었습니다!");
        setFormData({
          name: "",
          address: "",
          soyType: "",
          startMonth: "",
          endMonth: "",
          isAllYear: false,
          latitude: 0,
          longitude: 0,
        });
      } else {
        alert("제출에 실패했습니다: " + res.data.message);
      }
    } catch (err) {
      console.error(err);
      alert("제출에 실패했습니다.");
    }
  };
  return (
    <div className="p-4 sm:p-6 max-w-full sm:max-w-3xl mx-auto space-y-6">
      <div className="space-y-2">
        <h2 className="text-lg sm:text-xl font-semibold">위치 검색</h2>
        <div className="flex gap-2 flex-col sm:flex-row">
          <input
            type="text"
            placeholder="식당 이름 또는 주소를 입력하세요"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full border rounded px-3 py-2"
          />
          <button
            onClick={searchPlaces}
            className="w-full sm:w-auto px-4 py-2 bg-yellow-300 hover:bg-yellow-400 rounded"
          >
            검색
          </button>
        </div>
      </div>

      <div
        id="map"
        className="w-full rounded"
        style={{ height: "250px", maxHeight: "300px" }}
      ></div>

      <form
        onSubmit={handleSubmit}
        className="border p-4 rounded shadow space-y-4 bg-white"
      >
        <h2 className="text-lg sm:text-xl font-semibold">식당 등록</h2>

        <div>
          <label className="block mb-1 font-medium">식당 이름</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded"
            placeholder="예: 콩콩이네"
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">주소</label>
          <input
            type="text"
            name="address"
            value={formData.address}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded"
            placeholder="예: 서울시 강남구 ..."
          />
        </div>

        {/* 콩 종류별 가격 입력 섹션 */}
        <div>
          <label className="block mb-2 font-medium text-gray-700">콩 종류 및 가격</label>
          {formData.prices.map((priceItem, index) => (
            <div key={index} className="flex flex-col sm:flex-row gap-2 mb-2 items-center">
              <select
                name="beanType"
                value={priceItem.beanType}
                onChange={(e) => handlePriceItemChange(index, e)}
                className="w-full sm:w-1/2 border px-3 py-2 rounded focus:ring-yellow-500 focus:border-transparent"
                required // 최소 하나는 필수
              >
                <option value="">콩 종류 선택</option>
                <option value="SOY_BEAN">백태콩</option>
                <option value="BLACK_BEAN">검은콩</option>
                <option value="OTHER_BEAN">기타콩</option>
              </select>
              <input
                type="number"
                name="price"
                value={priceItem.price}
                onChange={(e) => handlePriceItemChange(index, e)}
                className="w-full sm:w-1/2 border px-3 py-2 rounded focus:ring-yellow-500 focus:border-transparent"
                placeholder="가격 (원)"
                min="0"
                required // 최소 하나는 필수
              />
              {formData.prices.length > 1 && ( // 가격 항목이 1개 이상일 때만 삭제 버튼 표시
                <button
                  type="button"
                  onClick={() => handleRemovePriceItem(index)}
                  className="p-2 bg-red-400 hover:bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-xl"
                  aria-label="가격 항목 삭제"
                >
                  ➖
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={handleAddPriceItem}
            className="mt-2 p-2 bg-green-400 hover:bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-xl"
            aria-label="가격 항목 추가"
          >
            ➕
          </button>
        </div>

        <div>
          <label className="block mb-1 font-medium">운영 기간</label>

          <div className="mb-2">
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                name="isAllYear"
                checked={formData.isAllYear}
                onChange={handleChange}
                className="mr-2"
              />
              연중무휴
            </label>
          </div>

          <div className="flex gap-2 flex-col sm:flex-row items-center">
            <input
              type="number"
              name="startMonth"
              value={formData.startMonth}
              onChange={handleChange}
              className="w-full sm:w-1/2 border px-3 py-2 rounded"
              min={1}
              max={12}
              placeholder="시작월"
              disabled={formData.isAllYear}
            />
            <span className="mx-0 sm:mx-2">~</span>
            <input
              type="number"
              name="endMonth"
              value={formData.endMonth}
              onChange={handleChange}
              className="w-full sm:w-1/2 border px-3 py-2 rounded"
              min={1}
              max={12}
              placeholder="종료월"
              disabled={formData.isAllYear}
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full sm:w-auto bg-black text-white px-6 py-2 rounded hover:bg-gray-800"
        >
          등록 요청 보내기
        </button>
      </form>
    </div>
  );
};
export default RestaurantSubmissionForm;
