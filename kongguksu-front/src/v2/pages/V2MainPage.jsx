import React from 'react';
import './V2Main.css';

const V2MainPage = () => {
  return (
    <div className="bg-background text-on-surface min-h-screen flex flex-col overflow-hidden relative">
      
      {/* 1. TopAppBar */}
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

      {/* 2. Main Map Area */}
      <main className="relative flex-grow w-full h-screen">
        {/* Mock Map Background */}
        <div className="absolute inset-0 z-0 bg-surface-container">
          <img 
            alt="Map of Seoul" 
            className="w-full h-full object-cover opacity-60 grayscale-[0.2] sepia-[0.1]" 
            src="https://images.unsplash.com/photo-1596464716127-f2a82984de30?q=80&w=2070&auto=format&fit=crop" 
          />
          
          {/* Active Marker */}
          <div className="absolute top-[42%] left-[45%] z-10 cursor-pointer group">
            <div className="bean-marker bg-primary-container border-2 border-primary">
              <span className="material-symbols-outlined text-primary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>restaurant</span>
            </div>
            <div className="mt-2 bg-surface-container-lowest px-4 py-1.5 rounded-full shadow-lg border border-outline-variant/10 whitespace-nowrap">
              <span className="text-xs font-black text-primary">진주회관</span>
            </div>
          </div>
        </div>

        {/* Floating Search Overlay */}
        <div className="absolute top-28 left-1/2 -translate-x-1/2 w-full max-w-md px-6 z-20">
          <div className="bg-surface-container-lowest/95 glass-panel flex items-center gap-3 px-6 py-4 rounded-[2rem] shadow-xl relative overflow-hidden">
            <div className="absolute -right-1 -top-1 opacity-20 pointer-events-none">
              <span className="material-symbols-outlined text-primary text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>ramen_dining</span>
            </div>
            <span className="material-symbols-outlined text-outline text-xl">search</span>
            <input 
              className="bg-transparent border-none focus:ring-0 text-on-surface placeholder-outline-variant/70 w-full font-bold text-sm" 
              placeholder="콩국수 맛집 검색..." 
              type="text"
            />
            <button className="flex items-center justify-center p-1.5 bg-primary-container rounded-full squishy">
              <span className="material-symbols-outlined text-primary text-xl">tune</span>
            </button>
          </div>
        </div>

        {/* Map Controls */}
        <div className="absolute right-6 top-1/2 -translate-y-1/2 flex flex-col gap-4 z-20">
          <button className="w-14 h-14 bg-surface-container-lowest rounded-2xl shadow-md flex items-center justify-center text-primary squishy">
            <span className="material-symbols-outlined text-2xl font-black">add</span>
          </button>
          <button className="w-14 h-14 bg-surface-container-lowest rounded-2xl shadow-md flex items-center justify-center text-primary squishy">
            <span className="material-symbols-outlined text-2xl font-black">remove</span>
          </button>
          <div className="h-2"></div>
          <button className="w-14 h-14 bg-primary-container rounded-2xl shadow-md flex items-center justify-center text-primary squishy">
            <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>my_location</span>
          </button>
        </div>

        {/* Selected Place Card */}
        <div className="absolute bottom-36 left-6 right-6 z-20 md:max-w-sm">
          <div className="bg-surface-container-lowest p-5 rounded-[2.5rem] shadow-2xl flex gap-4 border border-white">
            <div className="w-24 h-24 rounded-[1.8rem] overflow-hidden flex-shrink-0 bg-primary-container">
              <img 
                alt="Jinju Hoegwan" 
                className="w-full h-full object-cover" 
                src="https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?q=80&w=200&auto=format&fit=crop" 
              />
            </div>
            <div className="flex-grow py-1">
              <div className="flex justify-between items-start mb-1">
                <h3 className="font-black text-lg text-on-surface tracking-tight">진주회관</h3>
                <div className="bg-primary-container/30 px-2 py-1 rounded-full flex items-center gap-1">
                  <span className="material-symbols-outlined text-primary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  <span className="text-[10px] font-black text-primary">4.8</span>
                </div>
              </div>
              <p className="text-xs text-outline font-medium mb-3">서울 중구 서소문동</p>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-secondary-container text-on-secondary-container rounded-full text-[10px] font-black">레전드 맛집</span>
                <span className="text-[10px] font-black text-primary uppercase">영업 중</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* 3. BottomNavBar */}
      <nav className="fixed bottom-0 left-0 w-full flex justify-around items-center px-4 pb-10 pt-5 bg-[#FDF9ED] rounded-t-[3.5rem] shadow-[0_-15px_45px_rgba(105,94,52,0.06)] z-50 border-t border-primary-container/20">
        <NavItem icon="military_tech" label="랭킹" />
        <NavItem icon="add_circle" label="등록 요청" active />
        <NavItem icon="bookmark" label="저장" />
      </nav>
    </div>
  );
};

// 재사용 가능한 하단 네비 아이템 컴포넌트
const NavItem = ({ icon, label, active = false }) => (
  <a 
    href="#" 
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
  </a>
);

export default V2MainPage;