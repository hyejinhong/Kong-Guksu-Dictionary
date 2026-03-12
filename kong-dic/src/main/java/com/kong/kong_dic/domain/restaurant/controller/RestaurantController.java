package com.kong.kong_dic.domain.restaurant.controller;

import com.kong.kong_dic.common.response.BaseResponse;
import com.kong.kong_dic.common.model.BeanType;
import com.kong.kong_dic.domain.restaurant.dto.RestaurantRankingDto;
import com.kong.kong_dic.domain.restaurant.dto.RestaurantRequestDto;
import com.kong.kong_dic.domain.restaurant.dto.RestaurantResponseDto;
import com.kong.kong_dic.domain.restaurant.service.RestaurantService;
import com.kong.kong_dic.domain.user.entity.User;
import com.kong.kong_dic.global.annotation.AuthUser;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/restaurants")
@RequiredArgsConstructor
public class RestaurantController {

    private final RestaurantService restaurantService;

    @GetMapping
    public ResponseEntity<BaseResponse<Page<RestaurantResponseDto>>> getAllRestaurants(@PageableDefault(size = 10) Pageable pageable) {
        Page<RestaurantResponseDto> resultPage = restaurantService.getAllRestaurants(pageable);

        if (resultPage.isEmpty()) {
            return ResponseEntity.ok(BaseResponse.success("No registered restaurants found.", resultPage));
        }
        return ResponseEntity.ok(BaseResponse.success("Successfully fetched all registered restaurants.", resultPage));
    }

    /**
     * 식당 검색/필터링
     */
    @GetMapping("/filter")
    public ResponseEntity<BaseResponse<List<RestaurantResponseDto>>> getFilteredRestaurants(
            @RequestParam(required = false) Double lan,
            @RequestParam(required = false) Double lon,
            @RequestParam(required = false) String searchTerm,
            @RequestParam(required = false) String beanType,
            @RequestParam(required = false) String season,
            @RequestParam(required = false) Integer minPrice,
            @RequestParam(required = false) Integer maxPrice,
            Pageable pageable) {

        List<RestaurantResponseDto> result = restaurantService.searchAndFilterRestaurants(
                lan, lon, searchTerm, beanType, season, minPrice, maxPrice, pageable);

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
    public ResponseEntity<BaseResponse<RestaurantResponseDto>> getRestaurantById(@PathVariable Long id,
                                                                                 @AuthUser(required = false) UserDetails userDetails) {
        String username = (userDetails != null) ? userDetails.getUsername() : null;
        return ResponseEntity.ok(BaseResponse.success(restaurantService.getRestaurantById(id, username)));
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

    /**
     * 실시간 인기 콩국수 랭킹 조회 (TOP 10)
     */
    @GetMapping("/ranking")
    public ResponseEntity<BaseResponse<List<RestaurantRankingDto>>> getRestaurantRanking(@RequestParam(name = "period", defaultValue = "daily") String period) {
        return ResponseEntity.ok(BaseResponse.success(restaurantService.getTopRestaurants(period)));
    }

    /**
     * 실시간 인기 콩국수 랭킹 조회 (별점 기준 TOP 10)
     */
    @GetMapping("/ranking/rating")
    public ResponseEntity<BaseResponse<List<RestaurantRankingDto>>> getTopRatedRestaurantRanking() {
        return ResponseEntity.ok(BaseResponse.success(restaurantService.getTopRatedRestaurants()));
    }

}
