package com.kong.kong_dic_admin.domain.user.controller;

import com.kong.kong_dic.common.response.BaseResponse;
import com.kong.kong_dic_admin.domain.user.dto.AdminUserResponseDto;
import com.kong.kong_dic_admin.domain.user.dto.UserStatusUpdateRequestDto;
import com.kong.kong_dic_admin.domain.user.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/admin/users")
@RequiredArgsConstructor
public class AdminUserController {

    private final UserService userService;

    @GetMapping
    public ResponseEntity<BaseResponse<List<AdminUserResponseDto>>> getAllUsers() {
        return ResponseEntity.ok(BaseResponse.success(userService.getAllUsers()));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<BaseResponse<Void>> updateUserStatus(@PathVariable Long id,
                                                               @RequestBody UserStatusUpdateRequestDto request) {
        userService.updateUserStatus(id, request.isEnabled());
        return ResponseEntity.ok(BaseResponse.success());
    }
}
