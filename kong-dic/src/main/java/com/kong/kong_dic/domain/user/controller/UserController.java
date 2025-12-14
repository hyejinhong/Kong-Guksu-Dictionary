package com.kong.kong_dic.domain.user.controller;

import com.kong.kong_dic.common.exception.BaseException;
import com.kong.kong_dic.common.response.BaseResponse;
import com.kong.kong_dic.domain.restaurant.service.RestaurantCommentService;
import com.kong.kong_dic.domain.user.dto.*;
import com.kong.kong_dic.domain.user.entity.User;
import com.kong.kong_dic.domain.user.exception.UserExceptionType;
import com.kong.kong_dic.domain.user.service.UserService;
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
            @AuthenticationPrincipal UserDetails userDetails) {

        if (userDetails == null) {
            // 토큰은 유효하지만 userDetails를 가져오지 못했거나 인증이 풀렸을 경우 (이론상 JwtFilter에서 처리됨)
            throw new BaseException(UserExceptionType.UNAUTHORIZED, "인증 정보가 없습니다.");
        }

        UserProfileResponseDto responseDto = userService.getMyProfile(userDetails.getUsername());
        return ResponseEntity.ok(BaseResponse.success("User profile fetched successfully.", responseDto));
    }

    /**
     * 사용자 정보 수정 API
     * @param userDetails
     * @param request
     * @return
     */
    @PatchMapping("/me")
    public ResponseEntity<BaseResponse<UserProfileResponseDto>> updateMyProfile(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody UserProfileUpdateRequestDto request) {

        if (userDetails == null) {
            throw new BaseException(UserExceptionType.UNAUTHORIZED, "인증 정보가 없습니다.");
        }

        UserProfileResponseDto updatedProfile = userService.updateMyProfile(userDetails.getUsername(), request);
        return ResponseEntity.ok(BaseResponse.success("User profile updated successfully.", updatedProfile));
    }

    @GetMapping("/nickname/random")
    public ResponseEntity<BaseResponse<String>> getRandomNickname() {
        return ResponseEntity.ok(BaseResponse.success("Success", userService.getRandomNickname()));
    }

    @GetMapping("/me/comments")
    public ResponseEntity<Page<MyCommentResponse>> getMyComments(
            @AuthenticationPrincipal UserDetails userDetails,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        if (userDetails == null) {
            throw new BaseException(UserExceptionType.UNAUTHORIZED, "인증 정보가 없습니다.");
        }

        User user = (User) userDetails;
        Long userId = user.getId();
        Page<MyCommentResponse> response = commentService.getMyComments(userId, pageable);
        return ResponseEntity.ok(response);
    }
}
