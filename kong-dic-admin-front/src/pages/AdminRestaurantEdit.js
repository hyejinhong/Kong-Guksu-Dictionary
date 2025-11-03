import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom"; // useParams, useNavigate 임포트

const ADMIN_API_BASE_URL = process.env.REACT_APP_ADMIN_API_BASE_URL || 'http://localhost:8081';
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';

const AdminRestaurantEdit = () => {
    // URL 파라미터에서 식당 ID를 가져옴
    const { id: restaurantId } = useParams(); 
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [formData, setFormData] = useState({
        name: "",
        address: "",
        servesAllYear: false,
        startMonth: 1,
        endMonth: 12,
        latitude: "",
        longitude: "",
        // prices는 [ {beanType: "SOY_BEAN", price: 10000}, ... ] 형태를 가정
        prices: [], 
    });
    
    // 콩 종류 옵션 (AdminRestaurantSubmissions에서 사용했던 것과 동일)
    const BEAN_OPTIONS = [
        { label: "백태콩", value: "SOY_BEAN" },
        { label: "검은콩", value: "BLACK_BEAN" },
        { label: "기타콩", value: "OTHER_BEAN" },
    ];
    
    const getAuthHeader = () => {
        const token = localStorage.getItem("admin_token");
        return token ? { Authorization: `Bearer ${token}` } : {};
    };

    // ⭐ 1. 초기 데이터 로드 useEffect ⭐
    useEffect(() => {
        const fetchRestaurantData = async () => {
            try {
                // TODO: 백엔드에 식당 상세 정보를 가져오는 API 구현 필요
                const response = await axios.get(
                    `${API_BASE_URL}/restaurants/${restaurantId}`, // ⭐ 메인 백엔드 API (kong-dic) 호출 가정 ⭐
                    { headers: getAuthHeader() }
                );

                const data = response.data?.data;
                if (!data) {
                    throw new Error("식당 데이터가 없습니다.");
                }

                // 응답 데이터를 폼 상태에 맞게 가공하여 설정
                setFormData({
                    name: data.name || "",
                    address: data.address || "",
                    servesAllYear: data.servesAllYear || false,
                    startMonth: data.startMonth || 1,
                    endMonth: data.endMonth || 12,
                    latitude: data.latitude || "",
                    longitude: data.longitude || "",
                    // prices 필드를 DTO 구조에 맞게 설정 (List<BeanPrice> 가정)
                    prices: data.prices?.map(p => ({
                        beanType: p.beanType || "",
                        price: p.price || "",
                    })) || [{ beanType: "", price: "" }], // 가격이 없으면 기본 탭 하나 표시
                });

            } catch (err) {
                console.error("❌ 식당 데이터 로드 실패:", err);
                setError("식당 데이터를 불러오는 데 실패했습니다.");
            } finally {
                setLoading(false);
            }
        };

        fetchRestaurantData();
    }, [restaurantId]);
    
    // 일반 입력 변경 처리
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    }; 
    
    // 가격 입력 필드 변경 처리 핸들러
    const handlePriceItemChange = (index, event) => {
        const { name, value } = event.target;
        const newPrices = [...formData.prices];
        newPrices[index][name] = name === "price" ? Number(value) : value; // 가격은 숫자로 저장
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

    // ⭐ 2. 수정 제출 핸들러 ⭐
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                name: formData.name,
                address: formData.address,
                servesAllYear: formData.servesAllYear,
                startMonth: formData.servesAllYear ? 0 : parseInt(formData.startMonth),
                endMonth: formData.servesAllYear ? 0 : parseInt(formData.endMonth),
                latitude: formData.latitude,
                longitude: formData.longitude,
                prices: formData.prices
                    .filter(item => item.beanType && item.price)
                    .map(item => ({ beanType: item.beanType, price: parseInt(item.price) })),
            };
            
            // TODO: 백엔드에 식당 수정 API 구현 필요
            const res = await axios.patch(`${ADMIN_API_BASE_URL}/api/admin/restaurants/${restaurantId}`, payload, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('admin_token')}`,
                    'Content-Type': 'application/json',
                }
            });

            if (res.data.code === 0) {
                alert(`"${payload.name}" 식당 정보가 수정되었습니다!`);
                navigate('/restaurants/list'); // 수정 후 목록 페이지로 이동
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
        return <p className="text-center text-red-500 mt-8">❌ {error}</p>;
    }


    return (
        <div className="p-4 sm:p-6 max-w-full sm:max-w-3xl mx-auto space-y-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 text-center mb-6">🍽️ 식당 정보 수정 (ID: {restaurantId})</h1>

            <form onSubmit={handleSubmit} className="border p-6 rounded-xl shadow-lg space-y-5 bg-white">
                
                {/* 이름 및 주소 (읽기 전용 필드로 표시, 수정은 백엔드에서 승인 후 가능하도록 할 수도 있음) */}
                <div>
                    <label className="block mb-1 font-medium text-gray-700">식당 이름</label>
                    <input type="text" name="name" value={formData.name} onChange={handleChange}
                        className="w-full border px-3 py-2 rounded bg-gray-50 focus:ring-yellow-500 focus:border-transparent"
                        placeholder="식당 이름" required/>
                </div>

                <div>
                    <label className="block mb-1 font-medium text-gray-700">주소</label>
                    {/* 주소는 지도에서 찍어야 하므로, 수정 폼에서는 잠시 ReadOnly로 두거나 별도 로직 필요 */}
                    <input type="text" name="address" value={formData.address} onChange={handleChange}
                        className="w-full border px-3 py-2 rounded bg-gray-50 focus:ring-yellow-500 focus:border-transparent"
                        placeholder="주소" required/>
                    <p className="text-xs text-gray-500 mt-1">※ 주소/위도/경도 수정은 지도 검색 로직이 필요합니다. 현재는 텍스트만 수정 가능합니다.</p>
                </div>
                
                {/* ⭐ 콩 종류별 가격 입력 섹션 ⭐ */}
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
                                {BEAN_OPTIONS.map(option => (
                                    <option key={option.value} value={option.value}>{option.label}</option>
                                ))}
                            </select>
                            <input
                                type="number"
                                name="price"
                                value={priceItem.price}
                                onChange={(e) => handlePriceItemChange(index, e)}
                                className="w-full sm:w-1/2 border px-3 py-2 rounded focus:ring-yellow-500 focus:border-transparent"
                                placeholder="가격 (원)"
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
                                    ➖
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
                        ➕
                    </button>
                </div>

                {/* 운영 기간 수정 섹션 */}
                <div>
                    <label className="block mb-1 font-medium text-gray-700">운영 기간</label>
                    <div className="mb-2">
                        <label className="inline-flex items-center text-gray-700">
                            <input type="checkbox" name="servesAllYear" checked={formData.servesAllYear} onChange={handleChange}
                                className="mr-2 form-checkbox h-5 w-5 text-yellow-600 rounded" />
                            연중무휴
                        </label>
                    </div>

                    <div className="flex gap-2 flex-col sm:flex-row items-center">
                        <input type="number" name="startMonth" value={formData.startMonth} onChange={handleChange}
                            className="w-full sm:w-1/2 border px-3 py-2 rounded focus:ring-yellow-500 focus:border-transparent"
                            min={1} max={12} placeholder="시작월" disabled={formData.servesAllYear} />
                        <span className="mx-0 sm:mx-2 text-gray-700">~</span>
                        <input type="number" name="endMonth" value={formData.endMonth} onChange={handleChange}
                            className="w-full sm:w-1/2 border px-3 py-2 rounded focus:ring-yellow-500 focus:border-transparent"
                            min={1} max={12} placeholder="종료월" disabled={formData.servesAllYear} />
                    </div>
                </div>

                <div className="flex justify-between border-t pt-4">
                    <button type="button" onClick={() => navigate('/restaurants/list')}
                        className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded transition-colors duration-200 font-semibold"
                    >
                        목록으로
                    </button>
                    <button type="submit"
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
