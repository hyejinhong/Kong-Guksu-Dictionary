package com.kong.kong_dic.domain.user.controller;

import com.kong.kong_dic.common.exception.BaseException;
import com.kong.kong_dic.common.response.BaseResponse;
import com.kong.kong_dic.domain.user.dto.UserProfileResponseDto;
import com.kong.kong_dic.domain.user.dto.UserProfileUpdateRequestDto;
import com.kong.kong_dic.domain.user.dto.UserResponseDto;
import com.kong.kong_dic.domain.user.dto.UserUpdateRequestDto;
import com.kong.kong_dic.domain.user.entity.User;
import com.kong.kong_dic.domain.user.exception.UserExceptionType;
import com.kong.kong_dic.domain.user.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

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

    @GetMapping("/my")
    public ResponseEntity<BaseResponse<UserResponseDto>> getMyInfo(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(BaseResponse.success(userService.getMyInfo(user)));
    }

    @PatchMapping("/my")
    public ResponseEntity<BaseResponse<Void>> updateMyInfo(@AuthenticationPrincipal User user,
                                                           @RequestBody UserUpdateRequestDto request) {
        userService.updateMyInfo(user, request);
        return ResponseEntity.ok(BaseResponse.success());
    }

    // TODO permitAll
    @GetMapping("/nickname/random")
    public ResponseEntity<BaseResponse<String>> getRandomNickname() {
        return ResponseEntity.ok(BaseResponse.success("Success", userService.getRandomNickname()));
    }
}
