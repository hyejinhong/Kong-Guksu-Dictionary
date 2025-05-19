import React, { useEffect, useRef, useState } from "react";

const KakaoMapSearch = ({ onSelectPlace }) => {
  const mapRef = useRef(null);
  const [loaded, setLoaded] = useState(false);
  const [keyword, setKeyword] = useState("");

  // Kakao Maps script 동적 로딩
  useEffect(() => {
    const existingScript = document.getElementById("kakao-map-script");
    if (!existingScript) {
      const script = document.createElement("script");
      script.id = "kakao-map-script";
      script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.REACT_APP_KAKAO_API_KEY}&libraries=services`;
      script.async = true;
      script.onload = () => setLoaded(true);
      document.head.appendChild(script);
    } else {
      setLoaded(true);
    }
  }, []);

  // 지도 초기화
  useEffect(() => {
    if (!loaded) return;

    window.kakao.maps.load(() => {
      const container = mapRef.current;
      const options = {
        center: new window.kakao.maps.LatLng(37.5665, 126.9780), // 서울 시청
        level: 3,
      };
      const map = new window.kakao.maps.Map(container, options);
      const ps = new window.kakao.maps.services.Places();

      const infowindow = new window.kakao.maps.InfoWindow({ zIndex: 1 });

      const searchPlaces = (keyword) => {
        if (!keyword.trim()) return;
        ps.keywordSearch(keyword, (data, status) => {
          if (status === window.kakao.maps.services.Status.OK) {
            const bounds = new window.kakao.maps.LatLngBounds();
            data.forEach((place) => {
              const marker = new window.kakao.maps.Marker({
                map,
                position: new window.kakao.maps.LatLng(place.y, place.x),
              });

              window.kakao.maps.event.addListener(marker, "click", () => {
                infowindow.setContent(`<div style="padding:5px;font-size:12px;">${place.place_name}</div>`);
                infowindow.open(map, marker);
                if (onSelectPlace) onSelectPlace(place);
              });

              bounds.extend(new window.kakao.maps.LatLng(place.y, place.x));
            });
            map.setBounds(bounds);
          }
        });
      };

      // 검색 입력 후 자동 실행
      if (keyword) {
        searchPlaces(keyword);
      }
    });
  }, [loaded, keyword, onSelectPlace]);

  return (
    <div className="space-y-2">
      <input
        type="text"
        placeholder="주소 또는 식당명 검색"
        className="w-full p-2 border border-gray-300 rounded-md"
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
      />
      <div
        ref={mapRef}
        style={{ width: "100%", height: "400px", border: "1px solid #ccc" }}
      />
    </div>
  );
};

export default KakaoMapSearch;