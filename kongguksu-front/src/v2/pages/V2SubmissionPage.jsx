import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { toast } from 'react-hot-toast';
import './V2Main.css';

const KAKAO_MAP_SCRIPT_ID = 'kakao-map-sdk-submission';
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';
const SELECTED_PLACE_MAX_LEVEL = 4;

const V2SubmissionPage = () => {
  const navigate = useNavigate();
  const mapContainerRef = useRef(null);
  const [map, setMap] = useState(null);
  const [markers, setMarkers] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    startMonth: '',
    endMonth: '',
    isAllYear: false,
    latitude: '',
    longitude: '',
    prices: [{ beanType: '', price: '' }],
  });
  const [loading, setLoading] = useState(false);

  const loadKakaoMapScript = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (window.kakao && window.kakao.maps) {
        window.kakao.maps.load(() => resolve(window.kakao));
        return;
      }

      const existingScript = document.getElementById(KAKAO_MAP_SCRIPT_ID);
      if (existingScript) {
        existingScript.addEventListener('load', () => {
          window.kakao.maps.load(() => resolve(window.kakao));
        });
        return;
      }

      const script = document.createElement('script');
      script.id = KAKAO_MAP_SCRIPT_ID;
      script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.REACT_APP_KAKAO_MAP_API_KEY}&autoload=false&libraries=services`;
      script.async = true;
      script.onload = () => {
        window.kakao.maps.load(() => resolve(window.kakao));
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }, []);

  useEffect(() => {
    const initMap = async () => {
      try {
        const kakao = await loadKakaoMapScript();
        const options = {
          center: new kakao.maps.LatLng(37.5665, 126.978),
          level: 4,
        };
        const mapInstance = new kakao.maps.Map(mapContainerRef.current, options);
        setMap(mapInstance);
      } catch (error) {
        console.error('Kakao Maps load failed:', error);
      }
    };
    initMap();
  }, [loadKakaoMapScript]);

  const handlePriceItemChange = (index, event) => {
    const { name, value } = event.target;
    const newPrices = [...formData.prices];
    newPrices[index][name] = value;
    setFormData((prev) => ({ ...prev, prices: newPrices }));
  };

  const handleAddPriceItem = () => {
    setFormData((prev) => ({
      ...prev,
      prices: [...prev.prices, { beanType: '', price: '' }],
    }));
  };

  const handleRemovePriceItem = (index) => {
    const newPrices = formData.prices.filter((_, i) => i !== index);
    setFormData((prev) => ({ ...prev, prices: newPrices }));
  };

  const searchPlaces = () => {
    if (!searchKeyword.trim() || !map) return;

    const ps = new window.kakao.maps.services.Places();
    ps.keywordSearch(searchKeyword, (data, status) => {
      if (status !== window.kakao.maps.services.Status.OK) {
        toast.error('검색 결과가 없습니다.');
        return;
      }

      markers.forEach((marker) => marker.setMap(null));
      const newMarkers = [];
      const bounds = new window.kakao.maps.LatLngBounds();

      data.forEach((place) => {
        const position = new window.kakao.maps.LatLng(place.y, place.x);
        const marker = new window.kakao.maps.Marker({
          map,
          position,
        });

        window.kakao.maps.event.addListener(marker, 'click', () => {
          setFormData((prev) => ({
            ...prev,
            address: place.address_name,
            name: place.place_name,
            latitude: place.y,
            longitude: place.x,
          }));
          if (map.getLevel() > SELECTED_PLACE_MAX_LEVEL) {
            map.setLevel(SELECTED_PLACE_MAX_LEVEL, { anchor: position, animate: true });
          }
          map.panTo(position);
          toast.success('식당 정보가 입력되었습니다.');
        });

        newMarkers.push(marker);
        bounds.extend(position);
      });

      setMarkers(newMarkers);
      map.setBounds(bounds);
    });
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.latitude || !formData.longitude) {
      toast.error('지도를 통해 식당 위치를 먼저 선택해주세요.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: formData.name,
        address: formData.address,
        servesAllYear: formData.isAllYear,
        startMonth: formData.isAllYear ? 0 : parseInt(formData.startMonth),
        endMonth: formData.isAllYear ? 0 : parseInt(formData.endMonth),
        latitude: formData.latitude,
        longitude: formData.longitude,
        prices: formData.prices
          .map((item) => ({
            beanType: item.beanType,
            price: parseInt(item.price),
          }))
          .filter((item) => item.beanType && item.price),
      };

      const res = await api.post('/restaurants/submissions', payload);

      if (res.data.code === 0) {
        toast.success('식당 제보가 성공적으로 접수되었습니다!');
        navigate('/v2');
      } else {
        toast.error(res.data.message || '제출에 실패했습니다.');
      }
    } catch (err) {
      toast.error('서버 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="v2-root bg-background min-h-screen pb-20 overflow-y-auto">
      {/* Header */}
      <header className="sticky top-0 w-full z-50 bg-[#FDF9ED]/80 backdrop-blur-xl flex items-center px-6 py-4">
        <button onClick={() => navigate(-1)} className="mr-4 text-primary p-1 active:scale-90 transition-transform">
          <span className="material-symbols-outlined text-2xl">arrow_back</span>
        </button>
        <h1 className="text-xl font-black text-primary tracking-tight font-headline">식당 제보하기</h1>
      </header>

      <main className="px-6 py-8 max-w-2xl mx-auto space-y-10 box-border">
        {/* Step 1: Location Search */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-6 h-6 rounded-full bg-secondary text-white text-[10px] font-black flex items-center justify-center">1</span>
            <h2 className="text-lg font-black text-primary">식당 위치 찾기</h2>
          </div>
          <div className="relative">
            <input
              type="text"
              placeholder="식당 이름이나 주소를 검색해보세요"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && searchPlaces()}
              className="w-full pl-6 pr-14 py-4 rounded-3xl bg-surface-container border-none focus:ring-2 focus:ring-secondary text-on-surface font-bold placeholder-outline-variant"
            />
            <button
              onClick={searchPlaces}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-secondary text-white rounded-full active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined">search</span>
            </button>
          </div>
          <div ref={mapContainerRef} className="w-full h-64 rounded-[2rem] soy-shadow bg-surface-container-low overflow-hidden border-4 border-white"></div>
          <p className="text-xs text-outline font-medium px-2">💡 지도 위의 핀을 클릭하면 식당 정보가 자동으로 입력됩니다.</p>
        </section>

        {/* Step 2: Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-6 h-6 rounded-full bg-secondary text-white text-[10px] font-black flex items-center justify-center">2</span>
            <h2 className="text-lg font-black text-primary">식당 상세 정보</h2>
          </div>

          <div className="space-y-6 bg-surface-container-lowest p-6 sm:p-8 rounded-[2.5rem] soy-shadow">
            <div className="space-y-2">
              <label className="text-xs font-bold text-outline uppercase ml-2">식당 이름</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-6 py-4 rounded-2xl bg-surface-container-low border-none focus:ring-2 focus:ring-secondary text-on-surface font-bold"
                placeholder="식당 이름을 확인해주세요"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-outline uppercase ml-2">주소</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="w-full px-6 py-4 rounded-2xl bg-surface-container-low border-none focus:ring-2 focus:ring-secondary text-on-surface font-bold"
                placeholder="상세 주소를 확인해주세요"
                required
              />
            </div>

            <div className="space-y-4 pt-2">
              <label className="text-xs font-bold text-outline uppercase ml-2">콩 종류 및 가격</label>
              {formData.prices.map((priceItem, index) => (
                <div key={index} className="flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                  <select
                    name="beanType"
                    value={priceItem.beanType}
                    onChange={(e) => handlePriceItemChange(index, e)}
                    className="flex-1 min-w-0 px-3 py-4 rounded-2xl bg-surface-container-low border-none focus:ring-2 focus:ring-secondary text-on-surface font-bold text-xs sm:text-sm appearance-none"
                    required
                  >
                    <option value="">콩 종류</option>
                    <option value="SOY_BEAN">백태콩</option>
                    <option value="BLACK_BEAN">서리태</option>
                    <option value="OTHER_BEAN">기타콩</option>
                  </select>
                  <input
                    type="number"
                    name="price"
                    value={priceItem.price}
                    onChange={(e) => handlePriceItemChange(index, e)}
                    className="flex-1 min-w-0 px-4 py-4 rounded-2xl bg-surface-container-low border-none focus:ring-2 focus:ring-secondary text-on-surface font-bold text-xs sm:text-sm"
                    placeholder="가격"
                    required
                  />
                  {formData.prices.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemovePriceItem(index)}
                      className="p-1.5 text-red-400 active:scale-90 transition-transform shrink-0"
                    >
                      <span className="material-symbols-outlined text-xl">remove_circle</span>
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={handleAddPriceItem}
                className="w-full py-3 rounded-2xl border-2 border-dashed border-outline-variant text-outline hover:text-secondary hover:border-secondary transition-all flex items-center justify-center gap-2 font-bold text-sm"
              >
                <span className="material-symbols-outlined text-sm">add</span>
                콩 종류 추가하기
              </button>
            </div>

            <div className="space-y-4 pt-2">
              <div className="flex justify-between items-center px-2">
                <label className="text-xs font-bold text-outline uppercase">운영 기간</label>
                <label className="flex items-center gap-2 cursor-pointer group">
                  <span className="text-xs font-bold text-outline group-hover:text-secondary transition-colors">연중무휴</span>
                  <div className="relative">
                    <input
                      type="checkbox"
                      name="isAllYear"
                      checked={formData.isAllYear}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    <div className={`w-10 h-5 rounded-full transition-colors ${formData.isAllYear ? 'bg-secondary' : 'bg-outline-variant'}`}></div>
                    <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform ${formData.isAllYear ? 'translate-x-5' : 'translate-x-0'}`}></div>
                  </div>
                </label>
              </div>
              
              {!formData.isAllYear && (
                <div className="flex items-center gap-3 px-2">
                  <div className="flex-1">
                    <select
                      name="startMonth"
                      value={formData.startMonth}
                      onChange={handleChange}
                      className="w-full px-4 py-4 rounded-2xl bg-surface-container-low border-none focus:ring-2 focus:ring-secondary text-on-surface font-bold text-center appearance-none"
                    >
                      <option value="">시작월</option>
                      {[...Array(12)].map((_, i) => (
                        <option key={i+1} value={i+1}>{i+1}월</option>
                      ))}
                    </select>
                  </div>
                  <span className="text-outline font-black shrink-0">~</span>
                  <div className="flex-1">
                    <select
                      name="endMonth"
                      value={formData.endMonth}
                      onChange={handleChange}
                      className="w-full px-4 py-4 rounded-2xl bg-surface-container-low border-none focus:ring-2 focus:ring-secondary text-on-surface font-bold text-center appearance-none"
                    >
                      <option value="">종료월</option>
                      {[...Array(12)].map((_, i) => (
                        <option key={i+1} value={i+1}>{i+1}월</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-5 rounded-3xl bg-primary text-background font-black text-lg soy-shadow active:scale-95 transition-all disabled:opacity-50"
          >
            {loading ? '제출 중...' : '식당 제보 완료하기'}
          </button>
        </form>
      </main>
    </div>
  );
};

export default V2SubmissionPage;
