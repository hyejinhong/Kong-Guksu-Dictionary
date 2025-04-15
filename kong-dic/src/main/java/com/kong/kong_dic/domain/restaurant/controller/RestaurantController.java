package com.kong.kong_dic.domain.restaurant.controller;

import com.kong.kong_dic.domain.bean.BeanType;
import com.kong.kong_dic.domain.restaurant.dto.RestaurantRequestDto;
import com.kong.kong_dic.domain.restaurant.dto.RestaurantResponseDto;
import com.kong.kong_dic.domain.restaurant.service.RestaurantService;
import com.kong.kong_dic.global.response.BaseResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/restaurants")
@RequiredArgsConstructor
public class RestaurantController {

    private final RestaurantService restaurantService;

    /**
     * 모든 식당 조회
     *
     * @return
     */
    @GetMapping
    public ResponseEntity<BaseResponse<List<RestaurantResponseDto>>> getAllRestaurants(@RequestParam(required = false) Double lan,
                                                                                       @RequestParam(required = false) Double lon,
                                                                                       Pageable pageable) {
        List<RestaurantResponseDto> result = restaurantService.getAllRestaurants(lan, lon, pageable);
        if (result.isEmpty()) {
            return ResponseEntity.ok(BaseResponse.success("조회 결과가 없습니다.", result));
        }
        return ResponseEntity.ok(BaseResponse.success("Success", result));
    }

    /**
     * ID로 식당 조회
     *
     * @param id
     * @return
     */
    @GetMapping("/{id}")
    public ResponseEntity<BaseResponse<RestaurantResponseDto>> getRestaurantById(@PathVariable Long id) {
        return ResponseEntity.ok(BaseResponse.success(restaurantService.getRestaurantById(id)));
    }

    /**
     * 식당 추가
     *
     * @param request
     * @return
     */
    @PostMapping
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<BaseResponse<RestaurantResponseDto>> addRestaurant(@RequestBody RestaurantRequestDto request) {
        return ResponseEntity.ok(BaseResponse.success(restaurantService.addRestaurant(request)));
    }

    /**
     * 식당 수정
     *
     * @param id
     * @param request
     * @return
     */
    @PutMapping("/{id}")
    public ResponseEntity<BaseResponse<RestaurantResponseDto>> updateRestaurant(@PathVariable Long id, @RequestBody RestaurantRequestDto request) {
        return ResponseEntity.ok(BaseResponse.success(restaurantService.updateRestaurant(id, request)));
    }

    /**
     * 식당 삭제
     *
     * @param id
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<BaseResponse<Void>> deleteRestaurant(@PathVariable Long id) {
        restaurantService.deleteRestaurant(id);
        return ResponseEntity.ok(BaseResponse.success("Deleted."));
    }

    /**
     * 근처 식당 조회
     *
     * @param latitude
     * @param longitude
     * @return
     */
    @GetMapping("/nearby")
    public ResponseEntity<BaseResponse<List<RestaurantResponseDto>>> getNearbyRestaurants(@RequestParam Double latitude,
                                                                                          @RequestParam Double longitude,
                                                                                          @RequestParam Double distance,
                                                                                          Pageable pageable) {
        return ResponseEntity.ok(
                BaseResponse.success(restaurantService.getNearbyRestaurants(latitude, longitude, distance, pageable)));
    }

    /**
     * 콩 종류로 필터
     *
     * @param beanType
     * @return
     */
    @GetMapping("/by-bean")
    public ResponseEntity<BaseResponse<List<RestaurantResponseDto>>> getRestaurantsByBeanType(@RequestParam BeanType beanType,
                                                                                              @RequestParam(required = false) Double latitude,
                                                                                              @RequestParam(required = false) Double longitude,
                                                                                              Pageable pageable) {
        return ResponseEntity.ok(
                BaseResponse.success(restaurantService.getRestaurantsByBeanType(beanType, latitude, longitude, pageable)));
    }
}
