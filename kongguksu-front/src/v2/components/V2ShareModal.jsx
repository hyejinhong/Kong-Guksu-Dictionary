import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

const KAKAO_SDK_SCRIPT_ID = 'kakao-sdk';

const loadKakaoSdk = () => {
  return new Promise((resolve, reject) => {
    const existingScript = document.getElementById(KAKAO_SDK_SCRIPT_ID);

    const initializeKakao = () => {
      if (window.Kakao) {
        if (!window.Kakao.isInitialized()) {
          const kakaoApiKey = process.env.REACT_APP_KAKAO_MAP_API_KEY;
          if (kakaoApiKey) {
            window.Kakao.init(kakaoApiKey);
          } else {
            console.warn('Kakao API Key is missing.');
          }
        }
        resolve(window.Kakao);
        return true;
      }
      return false;
    };

    // 1. Already loaded and initialized
    if (window.Kakao) {
      initializeKakao();
      return;
    }

    // 2. Script tag already injected but Kakao not yet initialized
    if (existingScript) {
      const interval = setInterval(() => {
        if (initializeKakao()) {
          clearInterval(interval);
        }
      }, 100);

      setTimeout(() => {
        clearInterval(interval);
        if (!window.Kakao) {
          reject(new Error('Kakao SDK loading timed out.'));
        }
      }, 5000);
      return;
    }

    // 3. Insert new script tag
    const script = document.createElement('script');
    script.id = KAKAO_SDK_SCRIPT_ID;
    script.src = 'https://t1.kakaocdn.net/kakao_js_sdk/2.7.2/kakao.min.js';
    script.async = true;
    script.onload = () => {
      if (!initializeKakao()) {
        reject(new Error('Kakao SDK not available after load.'));
      }
    };
    script.onerror = () => reject(new Error('Failed to load Kakao SDK script.'));
    document.head.appendChild(script);
  });
};

const getBeanLabel = (beanType) => {
  if (beanType === 'SOY_BEAN') return '백태';
  if (beanType === 'BLACK_BEAN') return '서리태';
  if (beanType === 'OTHER_BEAN') return '기타';
  return beanType || '기타';
};

const formatPrice = (price) => {
  const numericPrice = Number(price);
  return Number.isFinite(numericPrice) ? `${numericPrice.toLocaleString()}원` : '가격 정보 없음';
};

const V2ShareModal = ({ isOpen, onClose, restaurant }) => {
  const [isKakaoReady, setIsKakaoReady] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadKakaoSdk()
        .then(() => setIsKakaoReady(true))
        .catch(err => {
          console.error('Failed to load Kakao SDK:', err);
          setIsKakaoReady(false);
        });
    }
  }, [isOpen]);

  if (!isOpen || !restaurant) return null;

  const beanTypes = restaurant.beanTypes?.length ? restaurant.beanTypes : [restaurant.beanType].filter(Boolean);
  
  const handleKakaoShare = () => {
    if (!isKakaoReady || !window.Kakao) {
      toast.error('카카오톡 공유를 준비하는 중입니다. 잠시 후 다시 시도해 주세요.');
      return;
    }

    const priceText = restaurant.prices?.length 
      ? restaurant.prices.map(p => `${getBeanLabel(p.beanType)}: ${formatPrice(p.price)}`).join('\n')
      : formatPrice(restaurant.price);

    try {
      window.Kakao.Share.sendDefault({
        objectType: 'feed',
        content: {
          title: `[콩국수 사전] ${restaurant.name}`,
          description: `📍 ${restaurant.address}\n\n${priceText}`,
          link: {
            mobileWebUrl: window.location.href,
            webUrl: window.location.href,
          },
        },
        buttons: [
          {
            title: '맛집 정보 보기',
            link: {
              mobileWebUrl: window.location.href,
              webUrl: window.location.href,
            },
          },
        ],
      });
      onClose();
    } catch (error) {
      console.error('Kakao share error:', error);
      toast.error('카카오톡 공유에 실패했습니다.');
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href)
      .then(() => {
        toast.success('링크가 클립보드에 복사되었습니다! 🎉');
        onClose();
      })
      .catch((err) => {
        console.error('Failed to copy link:', err);
        toast.error('링크 복사에 실패했습니다.');
      });
  };

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center px-4 pb-10 sm:pb-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-md bg-background rounded-[2.5rem] p-8 soy-shadow animate-in slide-in-from-bottom-10 duration-500"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-2xl font-bold text-primary tracking-tight">공유하기</h3>
          <button onClick={onClose} className="text-tertiary p-2 hover:bg-surface-container-low rounded-full transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-6 py-4">
          {/* Kakao Share */}
          <button 
            onClick={handleKakaoShare}
            className="flex flex-col items-center gap-3 group transition-transform active:scale-95 duration-200"
          >
            <div className="w-16 h-16 rounded-2xl bg-[#FEE500] text-[#191919] flex items-center justify-center shadow-[0_8px_16px_rgba(254,229,0,0.2)] group-hover:opacity-90 transition-opacity">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
                <path d="M12 3c-4.97 0-9 3.185-9 7.113 0 2.458 1.58 4.62 4.022 5.92-.178.615-.642 2.222-.736 2.56-.12.433.148.427.31.318.127-.087 2.016-1.37 2.82-1.92.51.074 1.037.113 1.584.113 4.97 0 9-3.185 9-7.113S16.97 3 12 3z"/>
              </svg>
            </div>
            <span className="text-sm font-bold text-[#695E34]">카카오톡 공유</span>
          </button>

          {/* Link Copy */}
          <button 
            onClick={handleCopyLink}
            className="flex flex-col items-center gap-3 group transition-transform active:scale-95 duration-200"
          >
            <div className="w-16 h-16 rounded-2xl bg-secondary-container text-on-secondary-container flex items-center justify-center shadow-[0_8px_16px_rgba(169,179,136,0.2)] group-hover:opacity-90 transition-opacity">
              <span className="material-symbols-outlined text-3xl font-bold">link</span>
            </div>
            <span className="text-sm font-bold text-[#695E34]">링크 복사</span>
          </button>
        </div>

        <div className="mt-8 text-center text-xs text-tertiary">
          고소한 콩국수 사전 맛집 정보를 친구들과 나눠보세요! 🍜
        </div>
      </div>
    </div>
  );
};

export default V2ShareModal;
