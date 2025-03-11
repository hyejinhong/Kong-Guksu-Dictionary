import React, { useEffect } from "react";

const KakaoMap = () => {
  useEffect(() => {
    const script = document.createElement("script");
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.REACT_APP_KAKAO_MAP_API_KEY}&libraries=services`;
    script.async = true;
    script.onload = () => {
      if (window.kakao && window.kakao.maps) {
        const container = document.getElementById("map"); // 지도를 표시할 div
        const options = {
          center: new window.kakao.maps.LatLng(37.5665, 126.9780), // 기본 위치 (서울)
          level: 5, // 확대 레벨
        };
        const map = new window.kakao.maps.Map(container, options);

        // 현재 위치 가져오기
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition((position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            const currentLocation = new window.kakao.maps.LatLng(lat, lng);

            map.setCenter(currentLocation);

            new window.kakao.maps.Marker({
              position: currentLocation,
              map: map,
            });
          });
        }
      }
    };
    document.body.appendChild(script);
  }, []);

  return <div id="map" className="w-11/12 h-80 mx-auto rounded-lg shadow-md"></div>;
};

export default KakaoMap;
