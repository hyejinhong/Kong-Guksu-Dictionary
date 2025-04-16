import React, { useEffect } from "react";

function KakaoMap({ restaurants }) {
  useEffect(() => {
    const initMap = () => {
      const container = document.getElementById("map");
      if (!container || !window.kakao || !window.kakao.maps) return;

      const { kakao } = window;

      const options = {
        center: new kakao.maps.LatLng(37.5665, 126.978), // 기본 중심
        level: 5,
      };

      const map = new kakao.maps.Map(container, options);

      // 사용자 위치 마커
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          const locPosition = new kakao.maps.LatLng(lat, lon);

          map.setCenter(locPosition);

          const imageSrc = "https://cdn0.iconfinder.com/data/icons/phosphor-fill-vol-3/256/person-fill-512.png"; // 현재 위치 마커 아이콘 (예시)
          const imageSize = new kakao.maps.Size(36, 36);
          const markerImage = new kakao.maps.MarkerImage(imageSrc, imageSize);

          const userMarker = new kakao.maps.Marker({
            map: map,
            position: locPosition,
            image: markerImage,
          });

          const infowindow = new kakao.maps.InfoWindow({
            content: "<div style='padding:5px;'>📍 현재 위치</div>",
          });
          infowindow.open(map, userMarker);
        });
      }

      // 식당 마커
      restaurants.forEach((restaurant) => {
        const position = new kakao.maps.LatLng(restaurant.latitude, restaurant.longitude);
        const marker = new kakao.maps.Marker({
          map: map,
          position,
        });

        const iwContent = `<div style="padding:5px;font-size:13px;font-weight:bold;">${restaurant.name}</div>`;
        const infowindow = new kakao.maps.InfoWindow({
          content: iwContent,
        });

        kakao.maps.event.addListener(marker, "mouseover", () => infowindow.open(map, marker));
        kakao.maps.event.addListener(marker, "mouseout", () => infowindow.close());
      });
    };

    // Kakao SDK 로드 완료 후 실행
    if (window.kakao && window.kakao.maps) {
      initMap();
    } else {
      const script = document.createElement("script");
      script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=★여기에_너의_카카오_API_키★&autoload=false&libraries=services`;
      script.async = true;
      script.onload = () => {
        window.kakao.maps.load(initMap);
      };
      document.head.appendChild(script);
    }
  }, [restaurants]);

  return (
    <div
      id="map"
      style={{
        width: "100%",
        height: "350px",
        borderRadius: "12px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
      }}
    />
  );
}

export default KakaoMap;
