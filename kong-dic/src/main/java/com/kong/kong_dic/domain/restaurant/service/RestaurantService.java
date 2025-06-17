package com.kong.kong_dic.domain.restaurant.service;

import com.kong.kong_dic.domain.bean.BeanType;
import com.kong.kong_dic.domain.restaurant.dto.RestaurantRequestDto;
import com.kong.kong_dic.domain.restaurant.dto.RestaurantResponseDto;
import com.kong.kong_dic.domain.restaurant.entity.Restaurant;
import com.kong.kong_dic.domain.restaurant.exception.RestaurantExceptionType;
import com.kong.kong_dic.domain.restaurant.repository.RestaurantRepository;
import com.kong.kong_dic.domain.user.entity.User;
import com.kong.kong_dic.domain.user.entity.UserRestaurantVisit;
import com.kong.kong_dic.domain.user.repository.UserRestaurantVisitRepository;
import com.kong.kong_dic.global.exception.BaseException;
import com.kong.kong_dic.global.model.Coordinates;
import com.kong.kong_dic.global.util.KakaoMapUtil;
import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.web.client.RestTemplateAutoConfiguration;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class RestaurantService {

    private final RestaurantRepository restaurantRepository;
    private final UserRestaurantVisitRepository visitRepository;
    private final KakaoMapUtil kakaoMapUtil;

    public List<RestaurantResponseDto> getAllRestaurants(Double lan, Double lon, Pageable pageable) {
        Page<Restaurant> page = restaurantRepository.findAll(pageable);
        return page.map(restaurant -> entityToResponseDto(restaurant, lan, lon)).toList();
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
        if (curLatitude == null && curLongitude == null) {
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
}
