import React, { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import './V2Main.css';

const KAKAO_MAP_SCRIPT_ID = 'kakao-map-sdk';
const DEFAULT_LOCATION = { latitude: 37.5665, longitude: 126.9780 };

const loadKakaoMapScript = () => {
  if (window.kakao?.maps) {
    return Promise.resolve(window.kakao);
  }

  return new Promise((resolve, reject) => {
    const existingScript = document.getElementById(KAKAO_MAP_SCRIPT_ID);

    if (existingScript) {
      existingScript.addEventListener('load', () => {
        window.kakao.maps.load(() => resolve(window.kakao));
      });
      existingScript.addEventListener('error', reject);
      return;
    }

    const kakaoMapApiKey = process.env.REACT_APP_KAKAO_MAP_API_KEY;

    if (!kakaoMapApiKey) {
      reject(new Error('REACT_APP_KAKAO_MAP_API_KEY is missing.'));
      return;
    }

    const script = document.createElement('script');
    script.id = KAKAO_MAP_SCRIPT_ID;
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${kakaoMapApiKey}&autoload=false&libraries=services`;
    script.async = true;
    script.onload = () => {
      window.kakao.maps.load(() => resolve(window.kakao));
    };
    script.onerror = reject;
    document.head.appendChild(script);
  });
};

const isCurrentlySelling = (restaurant) => {
  const { startMonth, endMonth, servesAllYear } = restaurant;
  const currentMonth = new Date().getMonth() + 1;

  if (servesAllYear) return true;
  if (!startMonth || !endMonth) return false;

  if (startMonth <= endMonth) {
    return startMonth <= currentMonth && currentMonth <= endMonth;
  }

  return currentMonth >= startMonth || currentMonth <= endMonth;
};

const getRestaurantPosition = (restaurant) => {
  const latitude = Number(restaurant.latitude);
  const longitude = Number(restaurant.longitude);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  return { latitude, longitude };
};

const V2MainPage = () => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const [location, setLocation] = useState(DEFAULT_LOCATION);
  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mapError, setMapError] = useState('');

  const fetchRestaurants = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const url = `${process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080'}/restaurants/filter`;
      const params = {
        lan: location.latitude,
        lon: location.longitude,
        page: 0,
        size: 50,
        searchTerm: searchTerm || null,
      };

      const response = await axios.get(url, { params });
      setRestaurants(response.data?.data ?? []);
      setSelectedRestaurant(null);
    } catch (fetchError) {
      console.error(fetchError);
      setError('식당 목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, [location.latitude, location.longitude, searchTerm]);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      () => {
        setLocation(DEFAULT_LOCATION);
      }
    );
  }, []);

  useEffect(() => {
    fetchRestaurants();
  }, [fetchRestaurants]);

  useEffect(() => {
    let ignore = false;

    const initMap = async () => {
      try {
        const kakao = await loadKakaoMapScript();
        if (ignore || !mapContainerRef.current || mapRef.current) return;

        const center = new kakao.maps.LatLng(location.latitude, location.longitude);
        mapRef.current = new kakao.maps.Map(mapContainerRef.current, {
          center,
          level: 5,
          draggable: true,
          scrollwheel: true,
        });
        mapRef.current.setDraggable(true);
        mapRef.current.setZoomable(true);
        window.setTimeout(() => mapRef.current?.relayout(), 0);
        setMapError('');
      } catch (initError) {
        console.error(initError);
        setMapError('카카오맵을 불러오지 못했습니다.');
      }
    };

    initMap();

    return () => {
      ignore = true;
    };
  }, [location.latitude, location.longitude]);

  useEffect(() => {
    const mapContainer = mapContainerRef.current;
    if (!mapContainer) return undefined;

    const preventPageGesture = (event) => {
      event.preventDefault();
    };

    mapContainer.addEventListener('touchstart', preventPageGesture, { passive: false });
    mapContainer.addEventListener('touchmove', preventPageGesture, { passive: false });

    return () => {
      mapContainer.removeEventListener('touchstart', preventPageGesture);
      mapContainer.removeEventListener('touchmove', preventPageGesture);
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const kakao = window.kakao;

    if (!map || !kakao?.maps) return;

    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];

    const bounds = new kakao.maps.LatLngBounds();
    let hasPosition = false;

    restaurants.forEach((restaurant) => {
      const position = getRestaurantPosition(restaurant);
      if (!position) return;

      const markerPosition = new kakao.maps.LatLng(position.latitude, position.longitude);
      const markerImage = new kakao.maps.MarkerImage(
        isCurrentlySelling(restaurant) ? '/images/on.png' : '/images/off.png',
        new kakao.maps.Size(42, 42),
        { offset: new kakao.maps.Point(21, 42) }
      );

      const marker = new kakao.maps.Marker({
        map,
        position: markerPosition,
        image: markerImage,
        title: restaurant.name,
      });

      kakao.maps.event.addListener(marker, 'click', () => {
        setSelectedRestaurant(restaurant);
        map.panTo(markerPosition);
      });

      markersRef.current.push(marker);
      bounds.extend(markerPosition);
      hasPosition = true;
    });

    if (hasPosition) {
      map.setBounds(bounds);
    } else {
      map.setCenter(new kakao.maps.LatLng(location.latitude, location.longitude));
    }
  }, [restaurants, location.latitude, location.longitude]);

  const zoomIn = () => {
    const map = mapRef.current;
    if (!map) return;
    map.setLevel(Math.max(map.getLevel() - 1, 1));
  };

  const zoomOut = () => {
    const map = mapRef.current;
    if (!map) return;
    map.setLevel(map.getLevel() + 1);
  };

  const moveToCurrentLocation = () => {
    const map = mapRef.current;
    if (!map || !navigator.geolocation || !window.kakao?.maps) return;

    navigator.geolocation.getCurrentPosition((position) => {
      const nextLocation = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };

      setLocation(nextLocation);
      map.panTo(new window.kakao.maps.LatLng(nextLocation.latitude, nextLocation.longitude));
    });
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    fetchRestaurants();
  };

  return (
    <div className="v2-root bg-background text-on-surface min-h-screen flex flex-col overflow-hidden relative">
      <header className="bg-[#FDF9ED]/90 dark:bg-stone-900/90 backdrop-blur-xl fixed top-0 z-50 flex justify-between items-center px-6 py-5 w-full">
        <div className="flex items-center gap-2">
          <div className="bg-primary-container p-2 rounded-2xl flex items-center justify-center">
            <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>restaurant</span>
          </div>
          <h1 className="text-xl font-bold text-primary tracking-tight">콩국수 사전</h1>
        </div>
        <button className="bg-primary-container text-on-primary-container px-6 py-2.5 rounded-full font-bold text-sm squishy shadow-sm">
          로그인
        </button>
      </header>

      <main className="relative flex-grow w-full h-screen">
        <div className="absolute inset-0 z-0 bg-surface-container">
          <div ref={mapContainerRef} className="v2-kakao-map w-full h-full" aria-label="카카오 지도" />
          {(mapError || error) && (
            <div className="absolute inset-0 flex items-center justify-center bg-surface-container text-primary font-bold">
              {mapError || error}
            </div>
          )}
        </div>

        <form onSubmit={handleSearchSubmit} className="absolute top-28 left-1/2 -translate-x-1/2 w-full max-w-md px-6 z-20">
          <div className="bg-surface-container-lowest/95 glass-panel flex items-center gap-3 px-6 py-4 rounded-[2rem] shadow-xl relative overflow-hidden">
            <div className="absolute -right-1 -top-1 opacity-20 pointer-events-none">
              <span className="material-symbols-outlined text-primary text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>ramen_dining</span>
            </div>
            <span className="material-symbols-outlined text-outline text-xl">search</span>
            <input
              className="bg-transparent border-none focus:ring-0 text-on-surface placeholder-outline-variant/70 w-full font-bold text-sm"
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="콩국수 맛집 검색..."
              type="text"
              value={searchTerm}
            />
            <button className="flex items-center justify-center p-1.5 bg-primary-container rounded-full squishy" type="submit" aria-label="검색">
              <span className="material-symbols-outlined text-primary text-xl">search</span>
            </button>
          </div>
        </form>

        {loading && (
          <div className="absolute top-52 left-1/2 -translate-x-1/2 z-20 bg-surface-container-lowest/95 px-5 py-3 rounded-full shadow-lg text-sm font-bold text-primary">
            콩국수 맛집을 찾는 중입니다...
          </div>
        )}

        <div className="absolute right-6 top-1/2 -translate-y-1/2 flex flex-col gap-4 z-20">
          <button onClick={zoomIn} className="w-14 h-14 bg-surface-container-lowest rounded-2xl shadow-md flex items-center justify-center text-primary squishy" aria-label="지도 확대">
            <span className="material-symbols-outlined text-2xl font-black">add</span>
          </button>
          <button onClick={zoomOut} className="w-14 h-14 bg-surface-container-lowest rounded-2xl shadow-md flex items-center justify-center text-primary squishy" aria-label="지도 축소">
            <span className="material-symbols-outlined text-2xl font-black">remove</span>
          </button>
          <div className="h-2"></div>
          <button onClick={moveToCurrentLocation} className="w-14 h-14 bg-primary-container rounded-2xl shadow-md flex items-center justify-center text-primary squishy" aria-label="현재 위치">
            <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>my_location</span>
          </button>
        </div>

        {selectedRestaurant && (
          <RestaurantCard restaurant={selectedRestaurant} />
        )}
      </main>

      <nav className="fixed bottom-0 left-0 w-full flex justify-around items-center px-4 pb-10 pt-5 bg-[#FDF9ED] rounded-t-[3.5rem] shadow-[0_-15px_45px_rgba(105,94,52,0.06)] z-50 border-t border-primary-container/20">
        <NavItem icon="military_tech" label="랭킹" />
        <NavItem icon="add_circle" label="등록 요청" active />
        <NavItem icon="bookmark" label="저장" />
      </nav>
    </div>
  );
};

const RestaurantCard = ({ restaurant }) => (
  <div className="absolute bottom-36 left-6 right-6 z-20 md:max-w-sm">
    <div className="bg-surface-container-lowest p-5 rounded-[2.5rem] shadow-2xl flex gap-4 border border-white">
      <div className="w-24 h-24 rounded-[1.8rem] overflow-hidden flex-shrink-0 bg-primary-container">
        <img
          alt={`${restaurant.name} 콩국수`}
          className="w-full h-full object-cover"
          src="https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?q=80&w=200&auto=format&fit=crop"
        />
      </div>
      <div className="flex-grow py-1 min-w-0">
        <div className="flex justify-between items-start mb-1 gap-2">
          <h3 className="font-black text-lg text-on-surface tracking-tight truncate">{restaurant.name}</h3>
          <div className="bg-primary-container/30 px-2 py-1 rounded-full flex items-center gap-1">
            <span className="material-symbols-outlined text-primary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
            <span className="text-[10px] font-black text-primary">
              {restaurant.averageRating ? restaurant.averageRating.toFixed(1) : '0.0'}
            </span>
          </div>
        </div>
        <p className="text-xs text-outline font-medium mb-3 truncate">{restaurant.address}</p>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-secondary-container text-on-secondary-container rounded-full text-[10px] font-black">
            {isCurrentlySelling(restaurant) ? '영업 중' : '시즌 외'}
          </span>
          {restaurant.price && (
            <span className="text-[10px] font-black text-primary">
              {restaurant.price.toLocaleString()}원
            </span>
          )}
        </div>
      </div>
    </div>
  </div>
);

const NavItem = ({ icon, label, active = false }) => (
  <button
    type="button"
    className={`flex flex-col items-center justify-center px-6 py-2 squishy ${
      active
        ? 'bg-primary-container text-primary rounded-[2rem] px-8 py-3 shadow-lg'
        : 'text-outline'
    }`}
  >
    <span className="material-symbols-outlined text-2xl mb-1" style={{ fontVariationSettings: active ? "'FILL' 1, 'wght' 700" : "'wght' 700" }}>
      {icon}
    </span>
    <span className="text-[11px] font-black tracking-tight uppercase">{label}</span>
  </button>
);

export default V2MainPage;
