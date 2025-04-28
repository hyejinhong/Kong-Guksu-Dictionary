package com.kong.kong_dic.domain.user.controller;

import com.kong.kong_dic.domain.user.dto.UserResponseDto;
import com.kong.kong_dic.domain.user.dto.UserUpdateRequestDto;
import com.kong.kong_dic.domain.user.entity.User;
import com.kong.kong_dic.domain.user.service.UserService;
import com.kong.kong_dic.global.response.BaseResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController("/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

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
}
