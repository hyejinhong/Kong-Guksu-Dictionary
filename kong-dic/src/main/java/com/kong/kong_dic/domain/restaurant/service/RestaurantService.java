package com.kong.kong_dic.domain.restaurant.service;

import com.kong.kong_dic.common.exception.BaseException;
import com.kong.kong_dic.common.model.Coordinates;
import com.kong.kong_dic.common.util.KakaoMapUtil;
import com.kong.kong_dic.common.model.BeanType;
import com.kong.kong_dic.common.model.BeanPrice;
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
import jakarta.persistence.EntityNotFoundException;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class RestaurantService {

    private final RestaurantRepository restaurantRepository;
    private final UserRepository userRepository;
    private final UserRestaurantVisitRepository visitRepository;
    private final KakaoMapUtil kakaoMapUtil;

    public Page<RestaurantResponseDto> getAllRestaurants(Pageable pageable) {
        Page<Restaurant> restaurantPage = restaurantRepository.findAll(pageable);

        Page<Restaurant> page = restaurantRepository.findAll(pageable);
        return page.map(restaurant -> entityToResponseDto(restaurant, null, null));
    }

    public List<RestaurantResponseDto> searchAndFilterRestaurants(
            Double lan, Double lon, String searchTerm, String beanType, String season,
            Integer minPrice, Integer maxPrice, Pageable pageable) {

        // Specification 동적 생성
        Specification<Restaurant> spec = (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            // 1. 텍스트 검색어 필터링 (이름 또는 주소)
            if (StringUtils.hasText(searchTerm)) {
                String lowerCaseSearchTerm = "%" + searchTerm.toLowerCase() + "%";
                Predicate nameLike = criteriaBuilder.like(criteriaBuilder.lower(root.get("name")), lowerCaseSearchTerm);
                Predicate addressLike = criteriaBuilder.like(criteriaBuilder.lower(root.get("address")), lowerCaseSearchTerm);
                predicates.add(criteriaBuilder.or(nameLike, addressLike));
            }

            // 2. 콩 종류 필터링 (beanTypes 필드가 String이고 콤마로 구분되어 있다고 가정)
            // 정확한 enum 값 (SOY_BEAN, BLACK_BEAN)으로 프론트에서 넘어온다고 가정
            if (StringUtils.hasText(beanType) && !"all".equalsIgnoreCase(beanType)) {
                BeanType enumBeanType = BeanType.valueOf(beanType.toUpperCase());
                predicates.add(criteriaBuilder.isMember(enumBeanType, root.get("beanTypes")));
                // 만약 beanTypes가 @ElementCollection이나 다른 방식으로 List/Set으로 저장된다면 쿼리가 달라짐
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
                Join<Restaurant, BeanPrice> pricesJoin = root.join("prices", JoinType.INNER);

                // prices 컬렉션 내의 각 BeanPrice 객체의 'price' 필드에 대해 범위 조건 적용
                predicates.add(criteriaBuilder.between(pricesJoin.get("price"), minPrice, maxPrice));

                // 참고: 만약 특정 beanType (예: 백태콩)의 가격만 필터링하고 싶다면,
                // 여기에 추가 조건을 넣을 수 있습니다:
                // predicates.add(criteriaBuilder.equal(pricesJoin.get("beanType"), BeanType.SOY_BEAN));
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

    public RestaurantResponseDto getRestaurantById(Long id, User user) {
        Restaurant restaurant = restaurantRepository.findById(id)
                .orElseThrow(() -> new BaseException(RestaurantExceptionType.RESTAURANT_NOT_FOUND));

        // 로그인 한 경우, 이미 저장 여부
        boolean isSaved = false;
        if (user != null) {
            isSaved = visitRepository.findByUserIdAndRestaurantId(user.getId(), id).isPresent();
        }

        RestaurantResponseDto responseDto = entityToResponseDto(restaurant);
        responseDto.setIsSaved(isSaved);
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
        return RestaurantResponseDto.builder()
                .id(restaurant.getId())
                .name(restaurant.getName())
                .address(restaurant.getAddress())
                .latitude(restaurant.getLatitude())
                .longitude(restaurant.getLongitude())
                .beanTypes(restaurant.getBeanTypes())
                .servesAllYear(restaurant.getServesAllYear())
                .startMonth(restaurant.getStartMonth())
                .endMonth(restaurant.getEndMonth())
                .prices(restaurant.getPrices())
                .distance(calculateDistance(restaurant, latitude, longitude))
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
