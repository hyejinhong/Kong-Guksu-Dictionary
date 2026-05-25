import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './V2Main.css';

const KAKAO_MAP_SCRIPT_ID = 'kakao-map-sdk';
const DEFAULT_LOCATION = { latitude: 37.5665, longitude: 126.9780 };
const INITIAL_MIN_PRICE = 5000;
const INITIAL_MAX_PRICE = 20000;
const LIST_PAGE_SIZE = 8;

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

const formatPrice = (price) => {
  const numericPrice = Number(price);
  return Number.isFinite(numericPrice) ? `${numericPrice.toLocaleString()}원` : '가격 정보 없음';
};

const getBeanLabel = (beanType) => {
  if (beanType === 'SOY_BEAN') return '백태';
  if (beanType === 'BLACK_BEAN') return '서리태';
  return beanType || '기타';
};

const isLoggedIn = () => {
  const token = localStorage.getItem('token');
  const exp = localStorage.getItem('exp');
  if (!token || !exp) return false;

  const now = Math.floor(Date.now() / 1000);
  if (now >= Number(exp)) {
    localStorage.removeItem('token');
    localStorage.removeItem('exp');
    localStorage.removeItem('role');
    return false;
  }
  return true;
};

const V2MainPage = () => {
  const navigate = useNavigate();
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const [activeView, setActiveView] = useState('map');
  const [location, setLocation] = useState(DEFAULT_LOCATION);
  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [submittedSearchTerm, setSubmittedSearchTerm] = useState('');
  const [filter, setFilter] = useState({
    beanType: 'all',
    openNow: false,
    minPrice: INITIAL_MIN_PRICE,
    maxPrice: INITIAL_MAX_PRICE,
  });
  const [listPage, setListPage] = useState(1);
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
        searchTerm: submittedSearchTerm || null,
        beanType: filter.beanType !== 'all' ? filter.beanType : null,
        season: filter.openNow ? 'open-now' : null,
        minPrice:
          filter.minPrice === INITIAL_MIN_PRICE && filter.maxPrice === INITIAL_MAX_PRICE
            ? null
            : filter.minPrice,
        maxPrice:
          filter.minPrice === INITIAL_MIN_PRICE && filter.maxPrice === INITIAL_MAX_PRICE
            ? null
            : filter.maxPrice,
      };

      const response = await axios.get(url, { params });
      setRestaurants(response.data?.data ?? []);
      setSelectedRestaurant(null);
      setListPage(1);
    } catch (fetchError) {
      console.error(fetchError);
      setError('식당 목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, [
    filter.beanType,
    filter.maxPrice,
    filter.minPrice,
    filter.openNow,
    location.latitude,
    location.longitude,
    submittedSearchTerm,
  ]);

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
    if (activeView !== 'map') return undefined;

    let ignore = false;

    const initMap = async () => {
      try {
        const kakao = await loadKakaoMapScript();
        if (ignore || !mapContainerRef.current) return;

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
      markersRef.current.forEach((marker) => marker.setMap(null));
      markersRef.current = [];
      mapRef.current = null;
    };
  }, [activeView, location.latitude, location.longitude]);

  useEffect(() => {
    if (activeView !== 'map') return undefined;

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
  }, [activeView]);

  useEffect(() => {
    const map = mapRef.current;
    const kakao = window.kakao;

    if (activeView !== 'map' || !map || !kakao?.maps) return;

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
  }, [activeView, restaurants, location.latitude, location.longitude]);

  const totalListPages = Math.max(1, Math.ceil(restaurants.length / LIST_PAGE_SIZE));
  const pagedRestaurants = useMemo(() => {
    const startIndex = (listPage - 1) * LIST_PAGE_SIZE;
    return restaurants.slice(startIndex, startIndex + LIST_PAGE_SIZE);
  }, [listPage, restaurants]);

  const updateFilter = (key, value) => {
    setFilter((prevFilter) => ({ ...prevFilter, [key]: value }));
  };

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
    setSubmittedSearchTerm(searchTerm.trim());
  };

  return (
    <div
      className={`v2-root bg-background text-on-surface min-h-screen relative ${
        activeView === 'map' ? 'overflow-hidden' : 'v2-list-root'
      }`}
    >
      <Header />

      {activeView === 'map' ? (
        <MapView
          error={error}
          handleSearchSubmit={handleSearchSubmit}
          loading={loading}
          mapContainerRef={mapContainerRef}
          mapError={mapError}
          moveToCurrentLocation={moveToCurrentLocation}
          searchTerm={searchTerm}
          selectedRestaurant={selectedRestaurant}
          setSearchTerm={setSearchTerm}
          zoomIn={zoomIn}
          zoomOut={zoomOut}
        />
      ) : (
        <ListView
          filter={filter}
          listPage={listPage}
          loading={loading}
          pagedRestaurants={pagedRestaurants}
          restaurants={restaurants}
          setListPage={setListPage}
          totalListPages={totalListPages}
          updateFilter={updateFilter}
        />
      )}

      <BottomNav activeView={activeView} setActiveView={setActiveView} />

      {/* 식당 제보 Floating Action Button */}
      <button
        onClick={() => {
          if (!isLoggedIn()) {
            navigate('/v2/login');
          } else {
            navigate('/v2/submit');
          }
        }}
        className="fixed bottom-28 right-6 z-40 px-5 py-3 bg-primary text-background rounded-full flex items-center gap-2 soy-shadow active:scale-95 transition-all hover:bg-primary/90 group"
        aria-label="식당 제보하기"
      >
        <span className="material-symbols-outlined text-2xl">ramen_dining</span>
        <span className="text-sm font-bold tracking-tight">제보</span>
      </button>
    </div>
  );
};

const Header = () => {
  const navigate = useNavigate();
  const loggedIn = isLoggedIn();

  const handleAuthAction = () => {
    if (loggedIn) {
      localStorage.removeItem('token');
      localStorage.removeItem('exp');
      localStorage.removeItem('role');
      window.location.reload(); // 상태 반영을 위해 새로고침
    } else {
      navigate('/v2/login');
    }
  };

  return (
    <header className="fixed top-0 w-full z-50 bg-[#FDF9ED]/80 backdrop-blur-xl flex justify-between items-center px-6 py-4">
      <div className="text-xl font-bold text-primary tracking-tight font-headline">
        콩국수사전
      </div>
      <button
        onClick={handleAuthAction}
        className="bg-primary-container text-on-primary-container font-semibold px-6 py-2 rounded-full active:scale-95 transition-transform"
      >
        {loggedIn ? '로그아웃' : '로그인'}
      </button>
    </header>
  );
};

const MapView = ({
  error,
  handleSearchSubmit,
  loading,
  mapContainerRef,
  mapError,
  moveToCurrentLocation,
  searchTerm,
  selectedRestaurant,
  setSearchTerm,
  zoomIn,
  zoomOut,
}) => (
  <main className="relative w-full h-[100dvh]">
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

    {selectedRestaurant && <MapRestaurantCard restaurant={selectedRestaurant} />}
  </main>
);

const ListView = ({
  filter,
  listPage,
  loading,
  pagedRestaurants,
  restaurants,
  setListPage,
  totalListPages,
  updateFilter,
}) => (
  <main className="pt-24 px-6 max-w-2xl mx-auto pb-36">
    <section className="space-y-6 mb-10">
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-2 px-2 no-scrollbar">
        <FilterChip active={filter.beanType === 'SOY_BEAN'} onClick={() => updateFilter('beanType', filter.beanType === 'SOY_BEAN' ? 'all' : 'SOY_BEAN')}>
          백태
        </FilterChip>
        <FilterChip active={filter.beanType === 'BLACK_BEAN'} onClick={() => updateFilter('beanType', filter.beanType === 'BLACK_BEAN' ? 'all' : 'BLACK_BEAN')}>
          서리태
        </FilterChip>
        <FilterChip active={filter.beanType === 'ETC'} onClick={() => updateFilter('beanType', filter.beanType === 'ETC' ? 'all' : 'ETC')}>
          기타
        </FilterChip>
      </div>

      <div className="bg-surface-container-low p-6 rounded-xl space-y-6">
        <div className="flex justify-between items-center">
          <label className="text-sm font-bold text-primary tracking-tight" htmlFor="open-now-toggle">
            현재 영업 중만 보기
          </label>
          <button
            id="open-now-toggle"
            type="button"
            onClick={() => updateFilter('openNow', !filter.openNow)}
            className={`w-12 h-6 rounded-full relative transition-colors ${filter.openNow ? 'bg-secondary' : 'bg-surface-container-highest'}`}
          >
            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${filter.openNow ? 'translate-x-7' : 'translate-x-1'}`}></div>
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between text-xs font-bold text-tertiary uppercase tracking-wider">
            <span>Price Range</span>
            <span className="text-secondary">
              {filter.minPrice.toLocaleString()}원 - {filter.maxPrice.toLocaleString()}원
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <PriceInput label="최소" value={filter.minPrice} onChange={(value) => updateFilter('minPrice', Math.min(value, filter.maxPrice))} />
            <PriceInput label="최대" value={filter.maxPrice} onChange={(value) => updateFilter('maxPrice', Math.max(value, filter.minPrice))} />
          </div>
          <PriceRangeSlider
            maxPrice={filter.maxPrice}
            minPrice={filter.minPrice}
            onMaxChange={(value) => updateFilter('maxPrice', Math.max(value, filter.minPrice))}
            onMinChange={(value) => updateFilter('minPrice', Math.min(value, filter.maxPrice))}
          />
        </div>
      </div>
    </section>

    <section className="space-y-4">
      {loading ? (
        <div className="bg-surface-container-lowest p-5 rounded-xl soy-shadow text-center text-primary font-bold">
          콩국수 맛집을 불러오는 중입니다...
        </div>
      ) : restaurants.length === 0 ? (
        <div className="bg-surface-container-lowest p-5 rounded-xl soy-shadow text-center text-tertiary font-semibold">
          조건에 맞는 식당이 없습니다.
        </div>
      ) : (
        pagedRestaurants.map((restaurant) => (
          <ListRestaurantCard key={restaurant.id || `${restaurant.name}-${restaurant.address}`} restaurant={restaurant} />
        ))
      )}
    </section>

    <section className="mt-12 mb-8 flex justify-center items-center gap-3">
      <button
        className="w-12 h-12 rounded-full bg-surface-container-highest flex items-center justify-center text-primary active:scale-90 transition-all disabled:opacity-40"
        disabled={listPage === 1}
        onClick={() => setListPage((page) => Math.max(1, page - 1))}
        type="button"
      >
        <span className="material-symbols-outlined font-bold">chevron_left</span>
      </button>
      <div className="flex gap-2">
        {Array.from({ length: Math.min(totalListPages, 3) }, (_, index) => {
          const page = index + 1;
          return (
            <button
              key={page}
              className={`w-10 h-10 rounded-full font-bold flex items-center justify-center transition-colors ${
                listPage === page
                  ? 'bg-secondary text-white soy-shadow'
                  : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'
              }`}
              onClick={() => setListPage(page)}
              type="button"
            >
              {page}
            </button>
          );
        })}
      </div>
      <button
        className="w-12 h-12 rounded-full bg-surface-container-highest flex items-center justify-center text-primary active:scale-90 transition-all disabled:opacity-40"
        disabled={listPage === totalListPages}
        onClick={() => setListPage((page) => Math.min(totalListPages, page + 1))}
        type="button"
      >
        <span className="material-symbols-outlined font-bold">chevron_right</span>
      </button>
    </section>
  </main>
);

const FilterChip = ({ active, children, onClick }) => (
  <button
    className={`flex-none px-5 py-2.5 rounded-full font-semibold text-sm transition-all ${
      active
        ? 'bg-secondary-container text-on-secondary-container soy-shadow'
        : 'bg-surface-container-highest text-on-surface-variant hover:bg-surface-container-high'
    }`}
    onClick={onClick}
    type="button"
  >
    {children}
  </button>
);

const PriceInput = ({ label, onChange, value }) => (
  <label className="block">
    <span className="block text-[10px] font-bold text-outline uppercase mb-1">{label}</span>
    <input
      className="w-full rounded-full border-outline-variant bg-surface-container-lowest text-sm font-bold text-primary focus:border-secondary focus:ring-secondary text-center"
      max={INITIAL_MAX_PRICE}
      min={INITIAL_MIN_PRICE}
      onChange={(event) => onChange(Number(event.target.value))}
      step={1000}
      type="number"
      value={value}
    />
  </label>
);

const PriceRangeSlider = ({ maxPrice, minPrice, onMaxChange, onMinChange }) => {
  const minPercent = ((minPrice - INITIAL_MIN_PRICE) / (INITIAL_MAX_PRICE - INITIAL_MIN_PRICE)) * 100;
  const maxPercent = ((maxPrice - INITIAL_MIN_PRICE) / (INITIAL_MAX_PRICE - INITIAL_MIN_PRICE)) * 100;

  return (
    <div className="v2-price-slider relative h-8">
      <div className="absolute left-0 right-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-surface-container-highest">
        <div
          className="absolute h-full rounded-full bg-secondary"
          style={{
            left: `${minPercent}%`,
            right: `${100 - maxPercent}%`,
          }}
        />
      </div>
      <input
        aria-label="최소 가격"
        className="v2-range-input"
        max={INITIAL_MAX_PRICE}
        min={INITIAL_MIN_PRICE}
        onChange={(event) => onMinChange(Number(event.target.value))}
        step={1000}
        type="range"
        value={minPrice}
      />
      <input
        aria-label="최대 가격"
        className="v2-range-input"
        max={INITIAL_MAX_PRICE}
        min={INITIAL_MIN_PRICE}
        onChange={(event) => onMaxChange(Number(event.target.value))}
        step={1000}
        type="range"
        value={maxPrice}
      />
    </div>
  );
};

const ListRestaurantCard = ({ restaurant }) => {
  const selling = isCurrentlySelling(restaurant);
  const beanTypes = restaurant.beanTypes?.length ? restaurant.beanTypes : [restaurant.beanType].filter(Boolean);

  return (
    <div className="bg-surface-container-lowest p-5 rounded-xl soy-shadow flex gap-4 items-start active:scale-[0.98] transition-transform">
      <div className={`w-16 h-16 rounded-lg flex items-center justify-center flex-shrink-0 ${selling ? 'bg-primary-container' : 'bg-surface-container-highest'}`}>
        <span className={`material-symbols-outlined text-3xl ${selling ? 'text-primary' : 'text-outline'}`} style={{ fontVariationSettings: selling ? "'FILL' 1" : "'FILL' 0" }}>
          restaurant
        </span>
      </div>
      <div className="flex-1 space-y-2 min-w-0">
        <div className="flex justify-between items-start gap-3">
          <h3 className="font-bold text-lg text-on-surface leading-tight truncate">{restaurant.name}</h3>
          <span className={`material-symbols-outlined flex-shrink-0 ${selling ? 'text-secondary' : 'text-outline-variant'}`} style={{ fontVariationSettings: selling ? "'FILL' 1" : "'FILL' 0" }}>
            {selling ? 'check_circle' : 'cancel'}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {beanTypes.map((beanType) => (
            <span key={beanType} className="bg-primary-fixed text-on-primary-fixed-variant text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
              {getBeanLabel(beanType)}
            </span>
          ))}
          <span className="bg-surface-container text-tertiary text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
            {formatPrice(restaurant.price)}
          </span>
        </div>
        <p className="text-tertiary text-sm leading-relaxed line-clamp-2">{restaurant.address}</p>
      </div>
    </div>
  );
};

const MapRestaurantCard = ({ restaurant }) => (
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
              {formatPrice(restaurant.price)}
            </span>
          )}
        </div>
      </div>
    </div>
  </div>
);

const BottomNav = ({ activeView, setActiveView }) => {
  const navigate = useNavigate();

  const handleSavedClick = () => {
    if (!isLoggedIn()) {
      navigate('/v2/login');
    } else {
      // 추후 저장 목록 기능 구현 시 연결
      console.log('Token exists and is valid');
    }
  };

  return (
    <nav className="fixed bottom-0 left-0 w-full flex justify-around items-center px-4 pb-6 pt-3 bg-[#FDF9ED]/80 backdrop-blur-xl z-50 rounded-t-xl shadow-[0_-20px_40px_rgba(105,94,52,0.08)]">
      <FooterItem active={activeView === 'list'} icon="dictionary" label="목록" onClick={() => setActiveView('list')} />
      <FooterItem active={activeView === 'map'} icon="map" label="지도" onClick={() => setActiveView('map')} />
      <FooterItem icon="bookmark" label="저장" onClick={handleSavedClick} />
      <FooterItem icon="person" label="내 정보" onClick={() => {}} />
    </nav>
  );
};

const FooterItem = ({ active = false, icon, label, onClick }) => (
  <button
    className={`flex flex-col items-center justify-center rounded-full active:scale-90 transition-all duration-300 ${
      active
        ? 'bg-primary-container text-primary px-5 py-2'
        : 'text-tertiary opacity-60 hover:bg-surface-container-low p-2'
    }`}
    onClick={onClick}
    type="button"
  >
    <span className="material-symbols-outlined" style={{ fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}>
      {icon}
    </span>
    <span className="font-label text-[10px] font-semibold tracking-wider uppercase">{label}</span>
  </button>
);

export default V2MainPage;
