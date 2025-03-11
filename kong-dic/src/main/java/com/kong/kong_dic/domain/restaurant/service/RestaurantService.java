package com.kong.kong_dic.domain.restaurant.service;

import com.kong.kong_dic.domain.bean.BeanType;
import com.kong.kong_dic.domain.restaurant.dto.RestaurantRequestDto;
import com.kong.kong_dic.domain.restaurant.dto.RestaurantResponseDto;
import com.kong.kong_dic.domain.restaurant.entity.Restaurant;
import com.kong.kong_dic.domain.restaurant.repository.RestaurantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class RestaurantService {

    private final RestaurantRepository restaurantRepository;

    public List<RestaurantResponseDto> getAllRestaurants() {
        return restaurantRepository.findAll().stream()
                .map(this::entityToDto)
                .toList();
    }

    public RestaurantResponseDto getRestaurantById(Long id) {
        return null;
    }

    public RestaurantResponseDto addRestaurant(RestaurantRequestDto request) {
        return null;
    }

    public RestaurantResponseDto updateRestaurant(Long id, RestaurantRequestDto request) {
        return null;
    }

    public void deleteRestaurant(Long id) {
    }

    public List<RestaurantResponseDto> getNearbyRestaurants(Double latitude, Double longitude) {
        return null;
    }

    public List<RestaurantResponseDto> getRestaurantsByBeanType(BeanType beanType) {
        return null;
    }

    private RestaurantResponseDto entityToDto(Restaurant restaurant) {
        return RestaurantResponseDto.builder()
                .id(restaurant.getId())
                .name(restaurant.getName())
                .address(restaurant.getAddress())
                .latitude(restaurant.getLatitude())
                .longitude(restaurant.getLongitude())
                .beanType(restaurant.getBeanType())
                .servesAllYear(restaurant.getServesAllYear())
                .startDate(restaurant.getStartDate())
                .endDate(restaurant.getEndDate())
                // .distance(calculateDistance(restaurant, restaurant.getLatitude(), restaurant.getLongitude()))
                .build();
    }

    private double calculateDistance(Restaurant restaurant, double curLatitude, double curLongitude) {
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
