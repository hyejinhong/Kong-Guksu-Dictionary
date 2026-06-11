package com.kong.kong_dic.domain.restaurant.controller;

import com.kong.kong_dic.common.domain.restaurant.dto.RestaurantSubmitRequestDto;
import com.kong.kong_dic.common.response.BaseResponse;
import com.kong.kong_dic.domain.restaurant.service.RestaurantSubmitService;
import com.kong.kong_dic.domain.user.entity.User;
import com.kong.kong_dic.global.annotation.AuthUser;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequestMapping("/restaurants/submissions")
@RequiredArgsConstructor
public class RestaurantSubmitController {

    private final RestaurantSubmitService submitService;

    @PostMapping
    public ResponseEntity<BaseResponse<Void>> addRestaurantSubmission(@AuthenticationPrincipal UserDetails userDetails, @RequestBody RestaurantSubmitRequestDto request) {
        log.info("### Restaurant Submission Controller - UserDetails: {}", userDetails);
        String username = userDetails != null ? userDetails.getUsername() : null;
        submitService.addRestaurantSubmission(username, request);
        return ResponseEntity.ok(BaseResponse.success());
    }
}

