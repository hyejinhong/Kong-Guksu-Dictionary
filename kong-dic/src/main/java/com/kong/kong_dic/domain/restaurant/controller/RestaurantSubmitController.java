package com.kong.kong_dic.domain.restaurant.controller;

import com.kong.kong_dic.common.domain.restaurant.dto.RestaurantSubmitRequestDto;
import com.kong.kong_dic.common.response.BaseResponse;
import com.kong.kong_dic.domain.restaurant.service.RestaurantSubmitService;
import com.kong.kong_dic.domain.user.entity.User;
import com.kong.kong_dic.global.annotation.AuthUser;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/restaurants/submissions")
@RequiredArgsConstructor
public class RestaurantSubmitController {

    private final RestaurantSubmitService submitService;

    @PostMapping
    public ResponseEntity<BaseResponse<Void>> addRestaurantSubmission(@AuthUser UserDetails userDetails, @RequestBody RestaurantSubmitRequestDto request) {
        submitService.addRestaurantSubmission(userDetails.getUsername(), request);
        return ResponseEntity.ok(BaseResponse.success());
    }
}

