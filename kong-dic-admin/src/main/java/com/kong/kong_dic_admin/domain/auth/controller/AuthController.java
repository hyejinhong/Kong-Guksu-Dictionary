package com.kong.kong_dic_admin.domain.auth.controller;

import com.kong.kong_dic.common.response.BaseResponse;
import com.kong.kong_dic_admin.domain.auth.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('ADMIN')")
public class AuthController {

    private final AuthService authService;

    @GetMapping("/verify-token")
    public ResponseEntity<BaseResponse<Boolean>> verifyToken(@RequestParam String token) {
        return ResponseEntity.ok(BaseResponse.success(authService.verifyToken(token)));
    }
}
