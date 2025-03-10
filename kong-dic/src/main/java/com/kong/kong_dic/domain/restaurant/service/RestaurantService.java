package com.kong.kong_dic.domain.restaurant.service;

import com.kong.kong_dic.domain.bean.BeanType;
import com.kong.kong_dic.domain.restaurant.dto.RestaurantRequestDto;
import com.kong.kong_dic.domain.restaurant.dto.RestaurantResponseDto;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class RestaurantService {

    public List<RestaurantResponseDto> getAllRestaurants() {
        return null;
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
}
