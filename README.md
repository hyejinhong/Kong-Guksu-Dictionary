# 🍜 콩국수사전 (KongGuksu Dictionary)
<img width="256" height="256" alt="image" src="https://github.com/user-attachments/assets/ebf5ec08-176c-418a-a5f7-bd5e4cd1b727" />

**"내 주변, 가장 완벽한 콩국수 맛집을 찾는 여정"** > 전국 방방곡곡 숨겨진 콩국수 맛집을 찾고, 공유하고, 기록하는 지도 및 랭킹 서비스입니다.

## ✨ 주요 기능 (Key Features)

### 🗺️ 내 주변 콩국수 지도 & 디테일한 필터링

* **카카오맵 API**를 활용한 위치 기반 식당 탐색
* 콩 종류(백태/서리태 등), 판매 계절(사계절/여름 한정), 가격대별 상세 필터링 제공
* 현재 내 위치 기준 거리순 정렬 기능

### 🏆 실시간 콩국수 랭킹 시스템

* **인기순(저장수) & 별점순** 랭킹 제공
* **오늘의 핫플 vs 누적 핫플**: 매일 자정에 초기화되는 일간(Daily) 랭킹과 누적(All-time) 랭킹 분리 제공
* **Redis ZSet**을 활용한 실시간 점수 집계 및 **캐싱(Cache)**을 통한 빠른 응답 속도 보장

### 📖 나만의 사전 및 리뷰

* 마음에 드는 식당을 내 사전에 '저장'
* 방문 후기와 별점을 남겨 다른 유저들과 정보 공유 (리뷰 등록 시 실시간 통계 반영)

## 🛠 기술 스택 (Tech Stack)

### Frontend

* **Framework:** React.js
* **Styling:** Tailwind CSS
* **HTTP Client / Routing:** Axios, React-Router-Dom

### Backend

* **Framework:** Spring Boot, Spring Data JPA
* **Database:** MariaDB
* **In-Memory Store:** Redis (Ranking, Caching & Stream)
* **Security:** Spring Security, JWT

### Infrastructure & APIs

* **Map:** Kakao Map API

## 📐 시스템 아키텍처 (System Architecture)

```mermaid
graph TD
    %% 스타일 정의
    classDef front fill:#e0f2fe,stroke:#0284c7,stroke-width:2px;
    classDef back fill:#fff7ed,stroke:#ea580c,stroke-width:2px;
    classDef db fill:#f0fdf4,stroke:#16a34a,stroke-width:2px;
    classDef redis fill:#fef2f2,stroke:#dc2626,stroke-width:2px;
    classDef user fill:#f3f4f6,stroke:#4b5563,stroke-width:2px,stroke-dasharray: 5 5;

    %% 클라이언트 영역
    subgraph Frontend [💻 React Application]
        User["👤 사용자"] -->|Browser| UI["🖥️ 화면 UI"]
        UI -->|Axios / REST API| API_GW["📡 API Requests"]
    end

    %% 백엔드 영역
    subgraph Backend [⚙️ Spring Boot Server]
        Security["🛡️ Security Layer<br/>(JwtFilter, @AuthUser)"]
        API["💼 API & Business Logic<br/>(Controllers, Services)"]
        EventLayer["📨 Event Handling<br/>(Redis Stream Consumer)"]

        API_GW --> Security
        Security --> API
    end

    %% 데이터베이스 영역
    subgraph Database [🗄️ Data Storage]
        MariaDB[("🐬 RDBMS: MariaDB")]
        Redis[("🔴 Redis: Cache/Stream")]
    end

    %% 동기 통신 흐름
    API -->|Read/Write| MariaDB
    API -->|Cache, Ranking| Redis

    %% 비동기 이벤트 흐름
    API -.->|Publish Event| Redis
    Redis -.->|Subscribe| EventLayer
    EventLayer -->|Save Data| MariaDB

    %% 스타일 적용
    class User user;
    class UI,API_GW front;
    class Security,API,EventLayer back;
    class MariaDB db;
    class Redis redis;
```
