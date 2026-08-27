package com.kong.kong_dic.domain.restaurant.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.kong.kong_dic.common.exception.BaseException;
import com.kong.kong_dic.common.model.Coordinates;
import com.kong.kong_dic.common.util.KakaoMapUtil;
import com.kong.kong_dic.common.model.BeanType;
import com.kong.kong_dic.common.model.BeanPrice;
import com.kong.kong_dic.domain.restaurant.dto.RestaurantRankingDto;
import com.kong.kong_dic.domain.restaurant.dto.RestaurantRequestDto;
import com.kong.kong_dic.domain.restaurant.dto.RestaurantResponseDto;
import com.kong.kong_dic.domain.restaurant.entity.Restaurant;
import com.kong.kong_dic.domain.restaurant.exception.RestaurantExceptionType;
import com.kong.kong_dic.domain.restaurant.repository.RestaurantRepository;
import com.kong.kong_dic.domain.restaurant.dto.RatingStatsDto;
import com.kong.kong_dic.domain.user.entity.User;
import com.kong.kong_dic.domain.user.entity.UserRestaurantVisit;
import com.kong.kong_dic.domain.user.exception.UserExceptionType;
import com.kong.kong_dic.domain.user.repository.UserRepository;
import com.kong.kong_dic.domain.user.repository.UserRestaurantVisitRepository;
import com.kong.kong_dic.global.service.RedisService;
import jakarta.persistence.EntityNotFoundException;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.Duration;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class RestaurantService {

    private final RestaurantRepository restaurantRepository;
    private final UserRepository userRepository;
    private final UserRestaurantVisitRepository visitRepository;
    private final KakaoMapUtil kakaoMapUtil;

    private final RedisService redisService;

    // =========================================================
    // 1. Redis Keys (ZSet): '조회수(Views)' 누적 전용
    // (getRestaurantById 호출 시에만 업데이트 됨)
    // =========================================================
    private static final String ZSET_VIEWS_ALL_KEY = "restaurant:ranking:views";
    private static final String ZSET_VIEWS_DAILY_KEY = "restaurant:ranking:views:daily";

    // =========================================================
    // 2. Redis Keys (String Cache): '조회수(Views)' 랭킹 결과 캐싱용
    // =========================================================
    private static final String CACHE_VIEWS_ALL_KEY = "restaurant:ranking:top10_cache";
    private static final String CACHE_VIEWS_DAILY_KEY = "restaurant:ranking:top10_cache:daily";

    // =========================================================
    // 3. Redis Keys (String Cache): '별점(Rating)' 랭킹 결과 캐싱용
    // (DB 통계 기반으로 계산 후 결과만 캐싱 됨)
    // =========================================================
    private static final String CACHE_RATING_ALL_KEY = "restaurant:ranking:rating_top10_cache";

    private static final Duration CACHE_TTL = Duration.ofMinutes(1);

    private final StringRedisTemplate stringRedisTemplate;
    private final ObjectMapper objectMapper;

    public Page<RestaurantResponseDto> getAllRestaurants(Pageable pageable) {
        Page<Restaurant> page = restaurantRepository.findAll(pageable);
        return page.map(restaurant -> entityToResponseDto(restaurant, null, null));
    }

    public List<RestaurantResponseDto> searchAndFilterRestaurants(
            Double lan, Double lon, String searchTerm, String beanType, String season,
            Integer minPrice, Integer maxPrice, Pageable pageable) {

        // Specification 동적 생성
        Specification<Restaurant> spec = (root, query, criteriaBuilder) -> {
            query.distinct(true); // 중복 조회 방지
            List<Predicate> predicates = new ArrayList<>();

            // 1. 텍스트 검색어 필터링 (이름 또는 주소)
            if (StringUtils.hasText(searchTerm)) {
                String lowerCaseSearchTerm = "%" + searchTerm.toLowerCase() + "%";
                Predicate nameLike = criteriaBuilder.like(criteriaBuilder.lower(root.get("name")), lowerCaseSearchTerm);
                Predicate addressLike = criteriaBuilder.like(criteriaBuilder.lower(root.get("address")), lowerCaseSearchTerm);
                predicates.add(criteriaBuilder.or(nameLike, addressLike));
            }

            Join<Restaurant, BeanPrice> pricesJoin = null;

            // 2. 콩 종류 필터링 (beanTypes 컬렉션 대신 prices 컬렉션 내의 beanType을 확인)
            if (StringUtils.hasText(beanType) && !"all".equalsIgnoreCase(beanType)) {
                BeanType enumBeanType = BeanType.valueOf(beanType.toUpperCase());
                if (enumBeanType == BeanType.OTHER_BEAN) {
                    // '기타' 필터인 경우: 콩 종류가 OTHER_BEAN 이거나, 콩 종류 정보가 아예 없는 경우(prices가 비어있는 경우) 둘 다 포함
                    pricesJoin = root.join("prices", JoinType.LEFT);
                    Predicate isOtherBean = criteriaBuilder.equal(pricesJoin.get("beanType"), BeanType.OTHER_BEAN);
                    Predicate noPriceInfo = criteriaBuilder.isEmpty(root.get("prices"));
                    Predicate beanTypeIsNull = criteriaBuilder.isNull(pricesJoin.get("beanType"));
                    predicates.add(criteriaBuilder.or(isOtherBean, noPriceInfo, beanTypeIsNull));
                } else {
                    // 백태 또는 서리태인 경우: 해당 콩 종류 정보가 확실히 있어야 함
                    pricesJoin = root.join("prices", JoinType.INNER);
                    predicates.add(criteriaBuilder.equal(pricesJoin.get("beanType"), enumBeanType));
                }
            }

            // 3. 판매 기간 필터링
            if (StringUtils.hasText(season)) {
                if ("always".equalsIgnoreCase(season)) {
                    predicates.add(criteriaBuilder.isTrue(root.get("servesAllYear")));
                } else if ("open-now".equalsIgnoreCase(season)) {
                    int currentMonth = LocalDate.now().getMonthValue();
                    // 사계절 판매 OR (현재 월이 판매 시작 월 >= 현재 월 <= 판매 종료 월)
                    // 계절이 연도를 걸쳐서 판매되는 경우 (예: 11월~2월) 추가 로직 필요
                    Predicate isSeasonalOpen = criteriaBuilder.and(
                            criteriaBuilder.isFalse(root.get("servesAllYear")),
                            criteriaBuilder.greaterThanOrEqualTo(root.get("endMonth"), currentMonth), // 현재 월이 종료 월 이전이거나
                            criteriaBuilder.lessThanOrEqualTo(root.get("startMonth"), currentMonth)   // 현재 월이 시작 월 이후이거나
                    );
                    Predicate isYearRound = criteriaBuilder.isTrue(root.get("servesAllYear"));
                    predicates.add(criteriaBuilder.or(isYearRound, isSeasonalOpen));
                }
            }

            if (minPrice != null && maxPrice != null) {
                // prices 컬렉션에 대한 Join을 수행합니다.
                // JoinType.INNER는 해당 조건에 맞는 BeanPrice가 하나라도 있는 식당만 포함합니다.
                // 만약 prices 컬렉션 자체가 없는 식당은 배제됩니다.
                if (pricesJoin == null) {
                    pricesJoin = root.join("prices", JoinType.INNER);
                }

                // prices 컬렉션 내의 각 BeanPrice 객체의 'price' 필드에 대해 범위 조건 적용
                predicates.add(criteriaBuilder.between(pricesJoin.get("price"), minPrice, maxPrice));
            }

            // 모든 조건을 AND 연산으로 결합
            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };

        // Specification과 Pageable을 사용하여 DB에서 직접 필터링된 결과 조회
        List<Restaurant> filteredRestaurants = restaurantRepository.findAll(spec, pageable).getContent();

        // 거리 계산 (이전과 동일하게 서비스 단에서 수행)
        // 사용자의 lan, lon이 있을 경우에만 거리 계산
        if (lan != null && lon != null) {
            return filteredRestaurants.stream()
                    .map(restaurant -> {
                        RestaurantResponseDto dto = entityToResponseDto(restaurant, lan, lon);
                        return dto;
                    })
                    .sorted((d1, d2) -> Double.compare(d1.getDistance(), d2.getDistance())) // 거리순 정렬
                    .collect(Collectors.toList());
        } else {
            // 위치 정보가 없으면 거리 없이 DTO로 변환
            return filteredRestaurants.stream()
                    .map(RestaurantService::entityToResponseDto)
                    .collect(Collectors.toList());
        }
    }

    /**
     * 실시간 인기 식당 TOP 10 조회 (캐싱)
     * @return
     */
    @Transactional
    public List<RestaurantRankingDto> getTopRestaurantsByViewCount(String period) {
        String cacheKey;
        String zSetKey;

        if ("all".equals(period)) {
            cacheKey = CACHE_VIEWS_ALL_KEY;
            zSetKey = ZSET_VIEWS_ALL_KEY;
        } else {
            cacheKey = CACHE_VIEWS_DAILY_KEY;
            zSetKey = ZSET_VIEWS_DAILY_KEY;
        }

        try {
            // 1. Redis에서 캐시된 완성본(JSON)이 있는지 먼저 확인 (Cache Hit)
            String cachedRanking = stringRedisTemplate.opsForValue().get(cacheKey);
            if (cachedRanking != null) {
                log.info(">> 랭킹 캐시 존재 (DB 조회 생략)");
                // JSON 문자열을 List<RestaurantRankingDto> 객체로 변환하여 즉시 반환
                return objectMapper.readValue(cachedRanking, new TypeReference<List<RestaurantRankingDto>>() {});
            }
        } catch (Exception e) {
            log.warn("랭킹 캐시 읽기 실패. DB 조회를 진행합니다.", e);
        }

        log.info(">> 랭킹 캐시 없음. ZSet 및 DB를 조회하여 랭킹을 새로 계산합니다.");

        // 2. 캐시가 없으면(Cache Miss) 기존 로직대로 새로 계산
        Set<String> topIdsObj = redisService.getTopRanking(zSetKey, 0, 9);

        if (topIdsObj == null || topIdsObj.isEmpty()) {
            return Collections.emptyList();
        }

        List<Long> topIds = topIdsObj.stream()
                .map(id -> Long.valueOf(String.valueOf(id)))
                .collect(Collectors.toList());

        List<Restaurant> restaurants = restaurantRepository.findAllById(topIds);

        Map<Long, Restaurant> restaurantMap = restaurants.stream()
                .collect(Collectors.toMap(Restaurant::getId, r -> r));

        List<RestaurantRankingDto> rankingList = new ArrayList<>();
        int rank = 1;
        for (Long id : topIds) {
            if (restaurantMap.containsKey(id)) {
                Restaurant restaurant = restaurantMap.get(id);
                // Redis에서 최신 점수 가져오기 (전체 누적 및 일간)
                Double totalScore = stringRedisTemplate.opsForZSet().score(ZSET_VIEWS_ALL_KEY, id.toString());
                Double dailyScore = stringRedisTemplate.opsForZSet().score(ZSET_VIEWS_DAILY_KEY, id.toString());
                
                Long defaultDbView = restaurant.getViewCount() != null ? restaurant.getViewCount() : 0L;
                Long totalView = (totalScore != null) ? totalScore.longValue() : defaultDbView;
                Long dailyView = (dailyScore != null) ? dailyScore.longValue() : 0L;

                rankingList.add(RestaurantRankingDto.of(restaurant, rank++, totalView, dailyView));
            }
        }

        // 3. 새로 계산한 랭킹 결과를 JSON으로 변환하여 Redis에 1분간 캐싱
        try {
            String rankingJson = objectMapper.writeValueAsString(rankingList);
            stringRedisTemplate.opsForValue().set(cacheKey, rankingJson, CACHE_TTL);
            log.debug(">> 새 랭킹 데이터 캐싱 완료 (TTL: 1분)");
        } catch (JsonProcessingException e) {
            log.error("랭킹 데이터 캐싱(직렬화) 실패", e);
        }

        return rankingList;
    }

    /**
     * 평균 별점 기반 인기 식당 TOP 10 조회 (캐싱 적용)
     */
    @Transactional(readOnly = true)
    public List<RestaurantRankingDto> getTopRatedRestaurants() {
        try {
            // 1. Redis에서 캐시된 완성본(JSON)이 있는지 확인 (Cache Hit)
            String cachedRanking = stringRedisTemplate.opsForValue().get(CACHE_RATING_ALL_KEY);
            if (cachedRanking != null) {
                log.info("🎯 별점 랭킹 캐시 적중! (DB 조회 생략)");
                return objectMapper.readValue(cachedRanking, new TypeReference<List<RestaurantRankingDto>>() {});
            }
        } catch (Exception e) {
            log.warn("별점 랭킹 캐시 읽기 실패. DB 조회를 진행합니다.", e);
        }

        log.info("🐌 별점 랭킹 캐시 없음. DB를 조회하여 별점 랭킹을 새로 계산합니다.");

        // 2. DB에서 별점 순으로 상위 10개 식당 직접 조회
        List<Restaurant> topRatedRestaurants = restaurantRepository.findTop10ByOrderByAverageRatingDesc();

        // 3. Entity List -> DTO List 로 변환 (순위 rank 값 부여)
        List<RestaurantRankingDto> rankingList = new ArrayList<>();
        int rank = 1;
        for (Restaurant restaurant : topRatedRestaurants) {
            rankingList.add(RestaurantRankingDto.of(restaurant, rank++));
        }

        // 4. 조회된 결과를 JSON으로 변환하여 Redis에 1분간 캐싱
        try {
            String rankingJson = objectMapper.writeValueAsString(rankingList);
            stringRedisTemplate.opsForValue().set(CACHE_RATING_ALL_KEY, rankingJson, CACHE_TTL);
            log.info("💾 새 별점 랭킹 데이터 캐싱 완료 (TTL: 1분)");
        } catch (Exception e) {
            log.error("별점 랭킹 데이터 캐싱(직렬화) 실패", e);
        }

        return rankingList;
    }

    public RestaurantResponseDto getRestaurantById(Long id, String username) {
        Restaurant restaurant = restaurantRepository.findById(id)
                .orElseThrow(() -> new BaseException(RestaurantExceptionType.RESTAURANT_NOT_FOUND));

        // 조회수 1 증가
        redisService.incrementScore(ZSET_VIEWS_ALL_KEY, id.toString(), 1.0);
        redisService.incrementScore(ZSET_VIEWS_DAILY_KEY, id.toString(), 1.0);

        // 현재 Redis 실시간 점수 가져오기
        Double totalScore = stringRedisTemplate.opsForZSet().score(ZSET_VIEWS_ALL_KEY, id.toString());
        Double todayScore = stringRedisTemplate.opsForZSet().score(ZSET_VIEWS_DAILY_KEY, id.toString());
        long totalView = (totalScore != null) ? totalScore.longValue() : 0L;
        long todayView = (todayScore != null) ? todayScore.longValue() : 0L;

        // 로그인 한 경우, 이미 저장 여부
        boolean isSaved = false;
        Long visitId = null;
        if (username != null) {
            User user = userRepository.findByUsername(username).orElseThrow(() -> new BaseException(UserExceptionType.USER_NOT_FOUND));
            var visitOpt = visitRepository.findByUserIdAndRestaurantId(user.getId(), id);
            if (visitOpt.isPresent()) {
                isSaved = true;
                visitId = visitOpt.get().getId();
            }
        }

        RestaurantResponseDto responseDto = entityToResponseDto(restaurant);
        responseDto.setViewCount(totalView);
        responseDto.setIsSaved(isSaved);
        responseDto.setVisitId(visitId);
        return responseDto;
    }

    public RestaurantResponseDto addRestaurant(RestaurantRequestDto request) {
        Coordinates coordinate = kakaoMapUtil.addressToCoordinates(request.getAddress());

        Restaurant restaurant = Restaurant.builder()
                .name(request.getName())
                .address(request.getAddress())
                .latitude(coordinate.getLatitude())
                .longitude(coordinate.getLongitude())
                .beanTypes(request.getBeanTypes())
                .servesAllYear(request.getServesAllYear())
                .startMonth(request.getStartMonth())
                .endMonth(request.getEndMonth())
                .prices(request.getPrices())
                .build();
        restaurantRepository.save(restaurant);
        return entityToResponseDto(restaurant);
    }

    @Transactional
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public RestaurantResponseDto updateRestaurant(Long id, RestaurantRequestDto request) {
        Restaurant restaurant = restaurantRepository.findById(id).orElseThrow(() -> new BaseException(RestaurantExceptionType.RESTAURANT_NOT_FOUND));

        Coordinates coordinate = kakaoMapUtil.addressToCoordinates(request.getAddress());

        restaurant.setAddress(request.getAddress());
        restaurant.setName(request.getName());
        restaurant.setLatitude(coordinate.getLatitude());
        restaurant.setLongitude(coordinate.getLongitude());
        restaurant.setServesAllYear(request.getServesAllYear());
        restaurant.setBeanTypes(request.getBeanTypes());
        restaurant.setStartMonth(request.getStartMonth());
        restaurant.setEndMonth(request.getEndMonth());
        restaurant.setPrices(request.getPrices());

        return entityToResponseDto(restaurant);
    }

    public void deleteRestaurant(Long id) {
        Restaurant restaurant = restaurantRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("식당을 찾을 수 없습니다: " + id));

        // Redis ZSet에서도 삭제 (유령 랭킹 방지)
        stringRedisTemplate.opsForZSet().remove(ZSET_VIEWS_ALL_KEY, id.toString());
        stringRedisTemplate.opsForZSet().remove(ZSET_VIEWS_DAILY_KEY, id.toString());

        restaurantRepository.delete(restaurant);
    }

    public List<RestaurantResponseDto> getNearbyRestaurants(Double latitude, Double longitude, Double distance, Pageable pageable) {
        Page<Restaurant> page = restaurantRepository.findNearbyRestaurants(latitude, longitude, distance, pageable);
        return page.map(restaurant -> entityToResponseDto(restaurant, latitude, longitude)).toList();
    }

    public List<RestaurantResponseDto> getRestaurantsByBeanType(BeanType beanType, Double latitude, Double longitude, Pageable pageable) {
        Page<Restaurant> page = restaurantRepository.findByBeanTypesContains(beanType, pageable);

        return page.map(restaurant -> entityToResponseDto(restaurant, latitude, longitude)).toList();
    }

    private static RestaurantResponseDto entityToResponseDto(Restaurant restaurant, Double latitude, Double longitude) {
        List<BeanType> beanTypes = restaurant.getBeanTypes();
        if (beanTypes == null || beanTypes.isEmpty()) {
            if (restaurant.getPrices() != null) {
                beanTypes = restaurant.getPrices().stream()
                        .map(BeanPrice::getBeanType)
                        .filter(Objects::nonNull)
                        .distinct()
                        .collect(Collectors.toList());
            }
        }

        return RestaurantResponseDto.builder()
                .id(restaurant.getId())
                .name(restaurant.getName())
                .address(restaurant.getAddress())
                .latitude(restaurant.getLatitude())
                .longitude(restaurant.getLongitude())
                .beanTypes(beanTypes)
                .servesAllYear(restaurant.getServesAllYear())
                .startMonth(restaurant.getStartMonth())
                .endMonth(restaurant.getEndMonth())
                .prices(restaurant.getPrices())
                .distance(calculateDistance(restaurant, latitude, longitude))
                .totalScraps(restaurant.getTotalScraps())
                .averageRating(restaurant.getAverageRating())
                .viewCount(restaurant.getViewCount())
                .build();
    }

    /**
     * 현재 좌표 정보가 없는 경우 오버로딩
     *
     * @param restaurant
     * @return
     */
    public static RestaurantResponseDto entityToResponseDto(Restaurant restaurant) {
        return entityToResponseDto(restaurant, null, null);
    }

    private static double calculateDistance(Restaurant restaurant, Double curLatitude, Double curLongitude) {
        if (curLatitude == null || curLongitude == null) {
            return -1;
        }

        if (restaurant.getLatitude() == null || restaurant.getLongitude() == null) {
            return -1;
        }

        final int EARTH_RADIUS_KM = 6371; // 지구 반지름 (km)

        double lat1 = Math.toRadians(restaurant.getLatitude());
        double lon1 = Math.toRadians(restaurant.getLongitude());
        double lat2 = Math.toRadians(curLatitude);
        double lon2 = Math.toRadians(curLongitude);

        double dLat = lat2 - lat1;
        double dLon = lon2 - lon1;

        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(lat1) * Math.cos(lat2) *
                        Math.sin(dLon / 2) * Math.sin(dLon / 2);

        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return EARTH_RADIUS_KM * c; // 거리 (km 단위)
    }

    /**
     * 사용자가 식당을 '나의 사전'에 저장하거나, 별점을 수정
     * 작업 후 식당의 전체 통계(저장 수, 평균 별점)를 업데이트
     */
    @Transactional
    public void addOrUpdateVisit(Long userId, Long restaurantId, Double rating) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BaseException(UserExceptionType.USER_NOT_FOUND));
        Restaurant restaurant = restaurantRepository.findById(restaurantId)
                .orElseThrow(() -> new BaseException(RestaurantExceptionType.RESTAURANT_NOT_FOUND));

        // 1. 기존 방문 기록 조회
        Optional<UserRestaurantVisit> existingVisit = visitRepository.findByUserIdAndRestaurantId(userId, restaurantId);

        if (existingVisit.isPresent()) {
            // 1-A. 이미 존재하면 별점만 업데이트 (수정)
            UserRestaurantVisit visit = existingVisit.get();
            visit.updateRating(rating);
            // JPA Dirty Checking으로 인해 save 호출 불필요 (트랜잭션 종료 시 자동 업데이트)
        } else {
            // 1-B. 없으면 새로 생성 (저장)
            UserRestaurantVisit newVisit = UserRestaurantVisit.builder()
                    .user(user)
                    .restaurant(restaurant)
                    .rating(rating)
                    .build();
            visitRepository.save(newVisit);
        }

        // 2. 통계 재계산 및 Restaurant 엔티티 업데이트 (역정규화)
        updateRestaurantStats(restaurantId);
    }

    // 내부적으로 사용되는 통계 업데이트 메서드
    private void updateRestaurantStats(Long restaurantId) {
        Restaurant restaurant = restaurantRepository.findById(restaurantId)
                .orElseThrow(() -> new BaseException(RestaurantExceptionType.RESTAURANT_NOT_FOUND));

        // DB에서 최신 통계 집계
        RatingStatsDto stats = visitRepository.findStatsByRestaurantId(restaurantId);

        // 결과가 없으면(모두 삭제된 경우) 0으로 초기화
        long count = stats != null ? stats.getCount() : 0L;
        double average = stats != null ? stats.getAverage() : 0.0;

        // 엔티티에 값 반영 (Restaurant 엔티티에 updateStats 메서드 필요)
        restaurant.updateStats(count, average);
    }
}
