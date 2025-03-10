package com.kong.kong_dic.domain.restaurant.controller;

import com.kong.kong_dic.domain.bean.BeanType;
import com.kong.kong_dic.domain.restaurant.dto.RestaurantRequestDto;
import com.kong.kong_dic.domain.restaurant.dto.RestaurantResponseDto;
import com.kong.kong_dic.domain.restaurant.service.RestaurantService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/restaurants")
@RequiredArgsConstructor
public class RestaurantController {

    private final RestaurantService restaurantService;

    /**
     * 모든 식당 조회
     * @return
     */
    @GetMapping
    public List<RestaurantResponseDto> getAllRestaurants() {
        return restaurantService.getAllRestaurants();
    }

    /**
     * ID로 식당 조회
     * @param id
     * @return
     */
    @GetMapping("/{id}")
    public RestaurantResponseDto getRestaurantById(@RequestParam Long id) {
        return restaurantService.getRestaurantById(id);
    }

    /**
     * 식당 추가
     * @param request
     * @return
     */
    @PostMapping
    public RestaurantResponseDto addRestaurant(@RequestBody RestaurantRequestDto request) {
        return restaurantService.addRestaurant(request);
    }

    /**
     * 식당 수정
     * @param id
     * @param request
     * @return
     */
    @PutMapping("/{id}")
    public RestaurantResponseDto updateRestaurant(@PathVariable Long id, @RequestBody RestaurantRequestDto request) {
        return restaurantService.updateRestaurant(id, request);
    }

    /**
     * 식당 삭제
     * @param id
     */
    @DeleteMapping("/{id}")
    public void deleteRestaurant(@PathVariable Long id) {
        restaurantService.deleteRestaurant(id);
    }

    /**
     * 근처 식당 조회
     * @param latitude
     * @param longitude
     * @return
     */
    @GetMapping("/nearby")
    public List<RestaurantResponseDto> getNearbyRestaurants(@RequestParam Double latitude, @RequestParam Double longitude) {
        return restaurantService.getNearbyRestaurants(latitude, longitude);
    }

    /**
     * 콩 종류로 필터
     * @param beanType
     * @return
     */
    @GetMapping("/by-bean")
    public List<RestaurantResponseDto> getRestaurantsByBeanType(@RequestParam BeanType beanType) {
        return restaurantService.getRestaurantsByBeanType(beanType);
    }
}
