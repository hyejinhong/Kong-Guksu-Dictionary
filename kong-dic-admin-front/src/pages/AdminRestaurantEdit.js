import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";

const MAIN_API_BASE_URL = process.env.REACT_APP_MAIN_API_BASE_URL || "http://localhost:8080";
const DEFAULT_CENTER = { latitude: 37.5665, longitude: 126.978 };

const AdminRestaurantEdit = () => {
    const { id: restaurantId } = useParams();
    const navigate = useNavigate();

    const mapContainerRef = useRef(null);
    const mapInitializedRef = useRef(false);
    const mainMarkerRef = useRef(null);
    const markersRef = useRef([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [mapError, setMapError] = useState(null);
    const [map, setMap] = useState(null);
    const [searchKeyword, setSearchKeyword] = useState("");
    const [formData, setFormData] = useState({
        name: "",
        address: "",
        servesAllYear: false,
        startMonth: 1,
        endMonth: 12,
        latitude: "",
        longitude: "",
        prices: [],
    });

    const BEAN_OPTIONS = [
        { label: "백태콩", value: "SOY_BEAN" },
        { label: "검은콩", value: "BLACK_BEAN" },
        { label: "기타콩", value: "OTHER_BEAN" },
    ];

    const getAuthHeader = () => {
        const token = localStorage.getItem("admin_token");
        return token ? { Authorization: `Bearer ${token}` } : {};
    };

    const loadKakaoMapScript = () => {
        return new Promise((resolve, reject) => {
            if (window.kakao?.maps?.services) {
                resolve(window.kakao);
                return;
            }

            const kakaoMapApiKey = process.env.REACT_APP_KAKAO_MAP_API_KEY;
            if (!kakaoMapApiKey) {
                reject(new Error("REACT_APP_KAKAO_MAP_API_KEY 환경 변수가 없습니다."));
                return;
            }

            const existingScript = document.getElementById("kakao-map-script");
            if (existingScript) {
                existingScript.addEventListener("load", () => {
                    window.kakao.maps.load(() => resolve(window.kakao));
                });
                existingScript.addEventListener("error", reject);
                return;
            }

            const script = document.createElement("script");
            script.id = "kakao-map-script";
            script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${kakaoMapApiKey}&autoload=false&libraries=services`;
            script.async = true;
            script.onload = () => {
                window.kakao.maps.load(() => resolve(window.kakao));
            };
            script.onerror = reject;
            document.head.appendChild(script);
        });
    };

    const clearSearchMarkers = () => {
        markersRef.current.forEach((marker) => marker.setMap(null));
        markersRef.current = [];
    };

    const updateMainMarker = (kakao, mapInstance, latitude, longitude) => {
        if (!latitude || !longitude) return;

        const position = new kakao.maps.LatLng(Number(latitude), Number(longitude));

        if (mainMarkerRef.current) {
            mainMarkerRef.current.setPosition(position);
        } else {
            mainMarkerRef.current = new kakao.maps.Marker({
                map: mapInstance,
                position,
            });
        }

        mapInstance.setCenter(position);
    };

    useEffect(() => {
        const fetchRestaurantData = async () => {
            try {
                const response = await axios.get(
                    `${MAIN_API_BASE_URL}/restaurants/${restaurantId}`,
                    { headers: getAuthHeader() }
                );

                const data = response.data?.data;
                if (!data) {
                    throw new Error("식당 데이터가 없습니다.");
                }

                setFormData({
                    name: data.name || "",
                    address: data.address || "",
                    servesAllYear: data.servesAllYear || false,
                    startMonth: data.startMonth || 1,
                    endMonth: data.endMonth || 12,
                    latitude: data.latitude || "",
                    longitude: data.longitude || "",
                    prices: data.prices?.map((p) => ({
                        beanType: p.beanType || "",
                        price: p.price || "",
                    })) || [{ beanType: "", price: "" }],
                });
                setSearchKeyword(data.name || data.address || "");
            } catch (err) {
                console.error("식당 데이터 로드 실패:", err);
                setError("식당 데이터를 불러오는 데 실패했습니다.");
            } finally {
                setLoading(false);
            }
        };

        fetchRestaurantData();
    }, [restaurantId]);

    useEffect(() => {
        if (loading || !mapContainerRef.current || mapInitializedRef.current) return;

        const initMap = async () => {
            try {
                mapInitializedRef.current = true;
                const kakao = await loadKakaoMapScript();
                const latitude = formData.latitude || DEFAULT_CENTER.latitude;
                const longitude = formData.longitude || DEFAULT_CENTER.longitude;
                const center = new kakao.maps.LatLng(Number(latitude), Number(longitude));
                const mapInstance = new kakao.maps.Map(mapContainerRef.current, {
                    center,
                    level: 4,
                    draggable: true,
                    scrollwheel: true,
                });

                setMap(mapInstance);
                updateMainMarker(kakao, mapInstance, formData.latitude, formData.longitude);
            } catch (err) {
                mapInitializedRef.current = false;
                console.error("Kakao Maps 로딩 실패:", err);
                setMapError("카카오 지도를 불러오지 못했습니다. API 키 설정을 확인해 주세요.");
            }
        };

        initMap();
    }, [loading, formData.latitude, formData.longitude]);

    useEffect(() => {
        if (!map || !window.kakao?.maps) return;
        updateMainMarker(window.kakao, map, formData.latitude, formData.longitude);
    }, [map, formData.latitude, formData.longitude]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const handlePriceItemChange = (index, event) => {
        const { name, value } = event.target;
        const newPrices = [...formData.prices];
        newPrices[index][name] = name === "price" ? Number(value) : value;
        setFormData((prev) => ({
            ...prev,
            prices: newPrices,
        }));
    };

    const handleAddPriceItem = () => {
        setFormData((prev) => ({
            ...prev,
            prices: [...prev.prices, { beanType: "", price: "" }],
        }));
    };

    const handleRemovePriceItem = (index) => {
        setFormData((prev) => ({
            ...prev,
            prices: prev.prices.filter((_, i) => i !== index),
        }));
    };

    const selectPlace = (place) => {
        const latitude = place.y;
        const longitude = place.x;
        const address = place.road_address_name || place.address_name || "";

        setFormData((prev) => ({
            ...prev,
            name: place.place_name || prev.name,
            address,
            latitude,
            longitude,
        }));
    };

    const searchPlaces = () => {
        if (!searchKeyword.trim()) {
            alert("식당 이름이나 주소를 입력해 주세요.");
            return;
        }

        if (!map || !window.kakao?.maps?.services) {
            alert("지도가 아직 준비되지 않았습니다.");
            return;
        }

        const ps = new window.kakao.maps.services.Places();
        ps.keywordSearch(searchKeyword, (data, status) => {
            if (status !== window.kakao.maps.services.Status.OK) {
                alert("검색 결과가 없습니다.");
                return;
            }

            clearSearchMarkers();
            const bounds = new window.kakao.maps.LatLngBounds();
            const newMarkers = data.map((place) => {
                const position = new window.kakao.maps.LatLng(place.y, place.x);
                const marker = new window.kakao.maps.Marker({
                    map,
                    position,
                });

                window.kakao.maps.event.addListener(marker, "click", () => {
                    selectPlace(place);
                    clearSearchMarkers();
                });

                bounds.extend(position);
                return marker;
            });

            markersRef.current = newMarkers;
            map.setBounds(bounds);
        });
    };

    const handleSearchKeyDown = (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            searchPlaces();
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                name: formData.name,
                address: formData.address,
                servesAllYear: formData.servesAllYear,
                startMonth: formData.servesAllYear ? 0 : parseInt(formData.startMonth, 10),
                endMonth: formData.servesAllYear ? 0 : parseInt(formData.endMonth, 10),
                latitude: formData.latitude,
                longitude: formData.longitude,
                prices: formData.prices
                    .filter((item) => item.beanType && item.price)
                    .map((item) => ({ beanType: item.beanType, price: parseInt(item.price, 10) })),
            };

            const res = await axios.put(`${MAIN_API_BASE_URL}/restaurants/${restaurantId}`, payload, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("admin_token")}`,
                    "Content-Type": "application/json",
                },
            });

            if (res.data.code === 0) {
                alert(`"${payload.name}" 식당 정보가 수정되었습니다.`);
                navigate("/restaurants/list");
            } else {
                alert("수정 실패: " + res.data.message);
            }
        } catch (err) {
            console.error("수정 오류:", err);
            alert("수정 처리 중 오류가 발생했습니다.");
        }
    };

    if (loading) {
        return <p className="text-center text-gray-600 mt-8">데이터 로딩 중...</p>;
    }

    if (error) {
        return <p className="text-center text-red-500 mt-8">{error}</p>;
    }

    return (
        <div className="p-4 sm:p-6 max-w-full sm:max-w-3xl mx-auto space-y-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 text-center mb-6">
                식당 정보 수정 (ID: {restaurantId})
            </h1>

            <section className="space-y-3">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-800">위치 검색</h2>
                <div className="flex gap-2 flex-col sm:flex-row">
                    <input
                        type="text"
                        value={searchKeyword}
                        onChange={(e) => setSearchKeyword(e.target.value)}
                        onKeyDown={handleSearchKeyDown}
                        className="w-full border px-3 py-2 rounded bg-gray-50 focus:ring-yellow-500 focus:border-transparent"
                        placeholder="식당 이름 또는 주소를 입력하세요"
                    />
                    <button
                        type="button"
                        onClick={searchPlaces}
                        className="w-full sm:w-auto bg-yellow-400 hover:bg-yellow-500 text-gray-900 px-5 py-2 rounded transition-colors duration-200 font-semibold"
                    >
                        검색
                    </button>
                </div>
                <div
                    ref={mapContainerRef}
                    className="w-full rounded border bg-gray-100"
                    style={{ height: "300px" }}
                />
                {mapError && <p className="text-sm text-red-500">{mapError}</p>}
                <p className="text-xs text-gray-500">
                    검색 결과 마커를 클릭하면 식당명, 주소, 위도, 경도가 수정 폼에 반영됩니다.
                </p>
            </section>

            <form onSubmit={handleSubmit} className="border p-6 rounded-xl shadow-lg space-y-5 bg-white">
                <div>
                    <label className="block mb-1 font-medium text-gray-700">식당 이름</label>
                    <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full border px-3 py-2 rounded bg-gray-50 focus:ring-yellow-500 focus:border-transparent"
                        placeholder="식당 이름"
                        required
                    />
                </div>

                <div>
                    <label className="block mb-1 font-medium text-gray-700">주소</label>
                    <input
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        className="w-full border px-3 py-2 rounded bg-gray-50 focus:ring-yellow-500 focus:border-transparent"
                        placeholder="주소"
                        required
                    />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                        <label className="block mb-1 font-medium text-gray-700">위도</label>
                        <input
                            type="number"
                            name="latitude"
                            value={formData.latitude}
                            onChange={handleChange}
                            className="w-full border px-3 py-2 rounded bg-gray-50 focus:ring-yellow-500 focus:border-transparent"
                            placeholder="37.5665"
                            step="any"
                            required
                        />
                    </div>
                    <div>
                        <label className="block mb-1 font-medium text-gray-700">경도</label>
                        <input
                            type="number"
                            name="longitude"
                            value={formData.longitude}
                            onChange={handleChange}
                            className="w-full border px-3 py-2 rounded bg-gray-50 focus:ring-yellow-500 focus:border-transparent"
                            placeholder="126.9780"
                            step="any"
                            required
                        />
                    </div>
                </div>

                <div className="border-t pt-4">
                    <label className="block mb-2 font-medium text-gray-700">콩 종류 및 가격 수정</label>
                    {formData.prices.map((priceItem, index) => (
                        <div key={index} className="flex flex-col sm:flex-row gap-2 mb-2 items-center">
                            <select
                                name="beanType"
                                value={priceItem.beanType}
                                onChange={(e) => handlePriceItemChange(index, e)}
                                className="w-full sm:w-1/3 border px-3 py-2 rounded focus:ring-yellow-500 focus:border-transparent"
                                required
                            >
                                <option value="">콩 종류 선택</option>
                                {BEAN_OPTIONS.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                            <input
                                type="number"
                                name="price"
                                value={priceItem.price}
                                onChange={(e) => handlePriceItemChange(index, e)}
                                className="w-full sm:w-1/2 border px-3 py-2 rounded focus:ring-yellow-500 focus:border-transparent"
                                placeholder="가격(원)"
                                min="0"
                                required
                            />
                            {formData.prices.length > 1 && (
                                <button
                                    type="button"
                                    onClick={() => handleRemovePriceItem(index)}
                                    className="p-2 bg-red-400 hover:bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-md"
                                    aria-label="가격 항목 삭제"
                                >
                                    -
                                </button>
                            )}
                        </div>
                    ))}
                    <button
                        type="button"
                        onClick={handleAddPriceItem}
                        className="mt-2 p-2 bg-green-400 hover:bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-md font-bold"
                        aria-label="가격 항목 추가"
                    >
                        +
                    </button>
                </div>

                <div>
                    <label className="block mb-1 font-medium text-gray-700">운영 기간</label>
                    <div className="mb-2">
                        <label className="inline-flex items-center text-gray-700">
                            <input
                                type="checkbox"
                                name="servesAllYear"
                                checked={formData.servesAllYear}
                                onChange={handleChange}
                                className="mr-2 form-checkbox h-5 w-5 text-yellow-600 rounded"
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
                            className="w-full sm:w-1/2 border px-3 py-2 rounded focus:ring-yellow-500 focus:border-transparent"
                            min={1}
                            max={12}
                            placeholder="시작월"
                            disabled={formData.servesAllYear}
                        />
                        <span className="mx-0 sm:mx-2 text-gray-700">~</span>
                        <input
                            type="number"
                            name="endMonth"
                            value={formData.endMonth}
                            onChange={handleChange}
                            className="w-full sm:w-1/2 border px-3 py-2 rounded focus:ring-yellow-500 focus:border-transparent"
                            min={1}
                            max={12}
                            placeholder="종료월"
                            disabled={formData.servesAllYear}
                        />
                    </div>
                </div>

                <div className="flex justify-between border-t pt-4">
                    <button
                        type="button"
                        onClick={() => navigate("/restaurants/list")}
                        className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded transition-colors duration-200 font-semibold"
                    >
                        목록으로
                    </button>
                    <button
                        type="submit"
                        className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded transition-colors duration-200 font-semibold"
                    >
                        정보 수정 저장
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AdminRestaurantEdit;
