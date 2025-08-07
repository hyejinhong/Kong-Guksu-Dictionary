package com.kong.kong_dic.domain.user.controller;

import com.kong.kong_dic.common.response.BaseResponse;
import com.kong.kong_dic.domain.user.dto.UserRestaurantVisitRequestDto;
import com.kong.kong_dic.domain.user.dto.UserRestaurantVisitResponseDto;
import com.kong.kong_dic.domain.user.entity.User;
import com.kong.kong_dic.domain.user.service.UserRestaurantVisitService;
import com.kong.kong_dic.domain.user.service.UserService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class UserRestaurantVisitController {

    private final UserService userService;
    private final UserRestaurantVisitService visitService;

    @GetMapping("/visited-restaurants")
    public ResponseEntity<BaseResponse<List<UserRestaurantVisitResponseDto>>> getVisitedRestaurants(@AuthenticationPrincipal User user,
                                                                                                    @PageableDefault(size = 10, page = 0, sort = "visitDate", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(BaseResponse.success(visitService.getVisitedRestaurants(user, pageable)));
    }

    @PostMapping("/visited-restaurants")
    public ResponseEntity<BaseResponse<Void>> createVisitedRestaurant(@AuthenticationPrincipal User user, @RequestBody UserRestaurantVisitRequestDto request) {
        visitService.insertVisitedRestaurant(user, request);
        return ResponseEntity.ok(BaseResponse.success());
    }

    @PatchMapping("/visited-restaurants/{id}")
    public ResponseEntity<BaseResponse<Void>> updateVisitedRestaurant(@AuthenticationPrincipal User user,
                                                                      @RequestBody UserRestaurantVisitRequestDto request,
                                                                      @PathVariable Long id) {
        visitService.updateVisitedRestaurant(user, request, id);
        return ResponseEntity.ok(BaseResponse.success());
    }

    @Transactional
    @DeleteMapping("/visited-restaurants/{id}")
    public ResponseEntity<BaseResponse<Void>> deleteVisitedRestaurant(@AuthenticationPrincipal User user, @PathVariable Long id) {
        visitService.deleteVisitedRestaurant(user, id);
        return ResponseEntity.ok(BaseResponse.success());
    }
}
