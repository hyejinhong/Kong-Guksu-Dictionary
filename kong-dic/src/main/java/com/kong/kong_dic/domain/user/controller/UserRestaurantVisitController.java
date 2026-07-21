package com.kong.kong_dic.domain.user.controller;

import com.kong.kong_dic.common.response.BaseResponse;
import com.kong.kong_dic.domain.user.dto.RestaurantVisitNoteResponseDto;
import com.kong.kong_dic.domain.user.dto.UserRestaurantVisitRequestDto;
import com.kong.kong_dic.domain.user.dto.UserRestaurantVisitResponseDto;
import com.kong.kong_dic.domain.user.entity.User;
import com.kong.kong_dic.domain.user.service.UserRestaurantVisitService;
import com.kong.kong_dic.domain.user.service.UserService;
import com.kong.kong_dic.global.annotation.AuthUser;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class UserRestaurantVisitController {

    private final UserService userService;
    private final UserRestaurantVisitService visitService;

    @GetMapping("/restaurants/{restaurantId}/visits")
    public ResponseEntity<BaseResponse<List<RestaurantVisitNoteResponseDto>>> getRestaurantVisitNotes(@PathVariable Long restaurantId) {
        return ResponseEntity.ok(BaseResponse.success(visitService.getRestaurantVisitNotes(restaurantId)));
    }

    @GetMapping("/visited-restaurants")
    public ResponseEntity<BaseResponse<List<UserRestaurantVisitResponseDto>>> getVisitedRestaurants(@AuthUser UserDetails userDetails,
                                                                                                    @PageableDefault(size = 10, page = 0, sort = "visitDate", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(BaseResponse.success(visitService.getVisitedRestaurants(userDetails.getUsername(), pageable)));
    }

    @PostMapping("/visited-restaurants")
    public ResponseEntity<BaseResponse<Void>> createVisitedRestaurant(@AuthUser UserDetails userDetails,
                                                                      @RequestBody UserRestaurantVisitRequestDto request) {
        visitService.insertVisitedRestaurant(userDetails.getUsername(), request);
        return ResponseEntity.ok(BaseResponse.success());
    }

    @PatchMapping("/visited-restaurants/{id}")
    public ResponseEntity<BaseResponse<Void>> updateVisitedRestaurant(@AuthUser UserDetails userDetails,
                                                                      @RequestBody UserRestaurantVisitRequestDto request,
                                                                      @PathVariable Long id) {
        visitService.updateVisitedRestaurant(userDetails.getUsername(), request, id);
        return ResponseEntity.ok(BaseResponse.success());
    }

    @Transactional
    @DeleteMapping("/visited-restaurants/{id}")
    public ResponseEntity<BaseResponse<Void>> deleteVisitedRestaurant(@AuthUser UserDetails userDetails,
                                                                      @PathVariable Long id) {
        visitService.deleteVisitedRestaurant(userDetails.getUsername(), id);
        return ResponseEntity.ok(BaseResponse.success());
    }
}
