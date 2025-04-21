import React, { useEffect } from "react";

function KakaoMap({ restaurants }) {
  useEffect(() => {
    const initMap = () => {
      const container = document.getElementById("map");
      if (!container || !window.kakao || !window.kakao.maps) return;

      const { kakao } = window;

      const options = {
        center: new kakao.maps.LatLng(37.5665, 126.978),
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

          const imageSrc = "https://cdn0.iconfinder.com/data/icons/phosphor-fill-vol-3/256/person-fill-512.png";
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

      // 콩국수 판매 여부 판단 함수
      function isCurrentlySelling(restaurant) {
        const { startMonth, endMonth, servesAllYear } = restaurant;
        const currentMonth = new Date().getMonth() + 1;

        if (servesAllYear) return true;

        if (startMonth <= endMonth) {
          return startMonth <= currentMonth && currentMonth <= endMonth;
        } else {
          return currentMonth >= startMonth || currentMonth <= endMonth;
        }
      }

      // 식당 마커
      restaurants.forEach((restaurant) => {
        const position = new kakao.maps.LatLng(restaurant.latitude, restaurant.longitude);

        // 현재 판매 중인지 여부에 따라 마커 이미지 변경
        const isSelling = isCurrentlySelling(restaurant);
        const imageSrc = isSelling
          ? "/images/open.png"   // 현재 판매 중 마커
          : "/images/closed.png";         // 일반 마커

        const imageSize = new kakao.maps.Size(36, 36);
        const markerImage = new kakao.maps.MarkerImage(imageSrc, imageSize);

        const marker = new kakao.maps.Marker({
          map: map,
          position,
          image: markerImage,
        });

        const iwContent = `<div style="padding:5px;font-size:13px;font-weight:bold;">${restaurant.name}</div>`;
        const infowindow = new kakao.maps.InfoWindow({
          content: iwContent,
        });

        kakao.maps.event.addListener(marker, "mouseover", () => infowindow.open(map, marker));
        kakao.maps.event.addListener(marker, "mouseout", () => infowindow.close());
      });
    };

    if (window.kakao && window.kakao.maps) {
      initMap();
    } else {
      const script = document.createElement("script");
      const kakaoMapApiKey = process.env.REACT_APP_KAKAO_MAP_API_KEY;
      script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${kakaoMapApiKey}&autoload=false&libraries=services`;
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
