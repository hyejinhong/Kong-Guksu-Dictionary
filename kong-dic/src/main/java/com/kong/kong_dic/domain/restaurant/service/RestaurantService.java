package com.kong.kong_dic.domain.restaurant.service;

import com.kong.kong_dic.domain.bean.BeanType;
import com.kong.kong_dic.domain.restaurant.dto.RestaurantRequestDto;
import com.kong.kong_dic.domain.restaurant.dto.RestaurantResponseDto;
import com.kong.kong_dic.domain.restaurant.entity.Restaurant;
import com.kong.kong_dic.domain.restaurant.repository.RestaurantRepository;
import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RestaurantService {

    private final RestaurantRepository restaurantRepository;

    public List<RestaurantResponseDto> getAllRestaurants() {
        return restaurantRepository.findAll().stream()
                .map(this::entityToResponseDto)
                .toList();
    }

    public RestaurantResponseDto getRestaurantById(Long id) {
        Restaurant restaurant = restaurantRepository.findById(id).orElseThrow(() -> new EntityNotFoundException("식당을 찾을 수 없습니다: " + id));
        return entityToResponseDto(restaurant);
    }

    public RestaurantResponseDto addRestaurant(RestaurantRequestDto request) {
        Restaurant restaurant = Restaurant.builder()
                .name(request.getName())
                .address(request.getAddress())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .beanTypes(request.getBeanTypes())
                .servesAllYear(request.getServesAllYear())
                .startMonth(request.getStartMonth())
                .endMonth(request.getEndMonth())
                .build();
        restaurantRepository.save(restaurant);
        return entityToResponseDto(restaurant);
    }

    @Transactional
    public RestaurantResponseDto updateRestaurant(Long id, RestaurantRequestDto request) {
        Restaurant restaurant = restaurantRepository.findById(id).orElseThrow(() -> new EntityNotFoundException("식당을 찾을 수 없습니다: " + id));

        restaurant.setAddress(request.getAddress());
        restaurant.setName(request.getName());
        restaurant.setLatitude(request.getLatitude());
        restaurant.setLongitude(request.getLongitude());
        restaurant.setServesAllYear(request.getServesAllYear());
        restaurant.setBeanTypes(request.getBeanTypes());
        restaurant.setStartMonth(request.getStartMonth());
        restaurant.setEndMonth(request.getEndMonth());

        return entityToResponseDto(restaurant);
    }

    public void deleteRestaurant(Long id) {
        Restaurant restaurant = restaurantRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("식당을 찾을 수 없습니다: " + id));

        restaurantRepository.delete(restaurant);
    }

    public List<RestaurantResponseDto> getNearbyRestaurants(Double latitude, Double longitude, Double distance) {
        return restaurantRepository.findNearbyRestaurants(latitude, longitude, distance)
                .stream()
                .map(this::entityToResponseDto)
                .collect(Collectors.toList());
    }

    public List<RestaurantResponseDto> getRestaurantsByBeanType(BeanType beanType) {
        return null;
    }

    private RestaurantResponseDto entityToResponseDto(Restaurant restaurant) {
        return RestaurantResponseDto.builder()
                .id(restaurant.getId())
                .name(restaurant.getName())
                .address(restaurant.getAddress())
                .latitude(restaurant.getLatitude())
                .longitude(restaurant.getLongitude())
                .beanType(restaurant.getBeanTypes())
                .servesAllYear(restaurant.getServesAllYear())
                .startMonth(restaurant.getStartMonth())
                .endMonth(restaurant.getEndMonth())
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
