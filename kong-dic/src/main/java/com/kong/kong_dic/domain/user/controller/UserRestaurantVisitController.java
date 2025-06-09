package com.kong.kong_dic.domain.user.controller;

import com.kong.kong_dic.domain.user.dto.UserRestaurantVisitRequestDto;
import com.kong.kong_dic.domain.user.dto.UserRestaurantVisitResponseDto;
import com.kong.kong_dic.domain.user.entity.User;
import com.kong.kong_dic.domain.user.service.UserRestaurantVisitService;
import com.kong.kong_dic.domain.user.service.UserService;
import com.kong.kong_dic.global.response.BaseResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class UserRestaurantVisitController {

    private final UserService userService;
    private final UserRestaurantVisitService visitService;

    @GetMapping("/visited-restaurants")
    public ResponseEntity<BaseResponse<List<UserRestaurantVisitResponseDto>>> getVisitedRestaurants(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(BaseResponse.success(visitService.getVisitedRestaurants(user)));
    }

    @PostMapping("/visited-restaurants")
    public ResponseEntity<BaseResponse<Void>> createVisitedRestaurant(@AuthenticationPrincipal User user, @RequestBody UserRestaurantVisitRequestDto request) {
        visitService.insertVisitedRestaurant(user, request);
        return ResponseEntity.ok(BaseResponse.success());
    }

}
