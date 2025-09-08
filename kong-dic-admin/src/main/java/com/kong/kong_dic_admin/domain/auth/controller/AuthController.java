package com.kong.kong_dic_admin.domain.auth.controller;

import com.kong.kong_dic.common.response.BaseResponse;
import com.kong.kong_dic_admin.domain.auth.dto.SignupRequestDto;
import com.kong.kong_dic_admin.domain.auth.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/signup")
    public ResponseEntity<BaseResponse<Void>> signup(@RequestBody SignupRequestDto request) throws Exception {
        authService.signup(request);
        return ResponseEntity.ok(BaseResponse.success());
    }

    @GetMapping("/verify-token")
    public ResponseEntity<BaseResponse<Boolean>> verifyToken(@RequestParam String token) {
        return ResponseEntity.ok(BaseResponse.success(authService.verifyToken(token)));
    }
}
