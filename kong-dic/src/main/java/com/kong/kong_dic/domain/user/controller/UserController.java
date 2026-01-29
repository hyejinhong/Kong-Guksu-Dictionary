package com.kong.kong_dic.domain.user.controller;

import com.kong.kong_dic.common.exception.BaseException;
import com.kong.kong_dic.common.response.BaseResponse;
import com.kong.kong_dic.domain.restaurant.service.RestaurantCommentService;
import com.kong.kong_dic.domain.user.dto.*;
import com.kong.kong_dic.domain.user.entity.User;
import com.kong.kong_dic.domain.user.exception.UserExceptionType;
import com.kong.kong_dic.domain.user.service.UserService;
import com.kong.kong_dic.global.annotation.AuthUser;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final RestaurantCommentService commentService;

    /**
     * 사용자 정보 조회 API
     * @param userDetails
     * @return
     */
    @GetMapping("/me")
    public ResponseEntity<BaseResponse<UserProfileResponseDto>> getMyProfile(
            @AuthUser UserDetails userDetails) {
        return ResponseEntity.ok(BaseResponse.success("User profile fetched successfully.", userService.getMyProfile(userDetails.getUsername())));
    }

    /**
     * 사용자 정보 수정 API
     * @param userDetails
     * @param request
     * @return
     */
    @PatchMapping("/me")
    public ResponseEntity<BaseResponse<UserProfileResponseDto>> updateMyProfile(
            @AuthUser UserDetails userDetails,
            @RequestBody UserProfileUpdateRequestDto request) {

        return ResponseEntity.ok(BaseResponse.success("User profile updated successfully.", userService.updateMyProfile(userDetails.getUsername(), request)));
    }

    @GetMapping("/nickname/random")
    public ResponseEntity<BaseResponse<String>> getRandomNickname() {
        return ResponseEntity.ok(BaseResponse.success("Success", userService.getRandomNickname()));
    }

    @GetMapping("/me/comments")
    public ResponseEntity<BaseResponse<Page<MyCommentResponse>>> getMyComments(
            @AuthUser UserDetails userDetails,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        return ResponseEntity.ok(BaseResponse.success("success", commentService.getMyComments(userDetails.getUsername(), pageable)));
    }
}
