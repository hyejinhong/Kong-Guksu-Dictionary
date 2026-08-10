package com.kong.kong_dic.domain.auth.controller;

import com.kong.kong_dic.common.response.BaseResponse;
import com.kong.kong_dic.domain.auth.dto.FindUsernameRequestDto;
import com.kong.kong_dic.domain.auth.dto.FindUsernameResponseDto;
import com.kong.kong_dic.domain.auth.dto.LoginResponseDto;
import com.kong.kong_dic.domain.auth.dto.RefreshRequestDto;
import com.kong.kong_dic.domain.auth.dto.SignupRequestDto;
import com.kong.kong_dic.domain.auth.dto.PasswordResetRequestDto;
import com.kong.kong_dic.domain.auth.dto.PasswordResetConfirmDto;
import jakarta.servlet.http.HttpServletRequest;
import com.kong.kong_dic.domain.auth.service.AuthService;
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

    @PostMapping("/find-username")
    public ResponseEntity<BaseResponse<FindUsernameResponseDto>> findUsername(@RequestBody FindUsernameRequestDto request) {
        return ResponseEntity.ok(BaseResponse.success(authService.findUsername(request)));
    }

    @PostMapping("/refresh")
    public ResponseEntity<BaseResponse<LoginResponseDto>> refresh(@RequestBody RefreshRequestDto request) {
        return ResponseEntity.ok(BaseResponse.success(authService.refresh(request.getRefreshToken())));
    }

    @PostMapping("/logout")
    public ResponseEntity<BaseResponse<Void>> logout(@RequestBody RefreshRequestDto request) {
        authService.logout(request.getRefreshToken());
        return ResponseEntity.ok(BaseResponse.success());
    }

    @GetMapping("/verify-token")
    public ResponseEntity<BaseResponse<Boolean>> verifyToken(@RequestParam String token) {
        return ResponseEntity.ok(BaseResponse.success(authService.verifyToken(token)));
    }

    @PostMapping("/reset-password/request")
    public ResponseEntity<BaseResponse<Void>> requestPasswordReset(
            @RequestBody PasswordResetRequestDto request,
            HttpServletRequest servletRequest
    ) throws Exception {
        String origin = servletRequest.getHeader("Origin");
        authService.requestPasswordReset(request, origin);
        return ResponseEntity.ok(BaseResponse.success());
    }

    @PostMapping("/reset-password/confirm")
    public ResponseEntity<BaseResponse<Void>> confirmPasswordReset(
            @RequestBody PasswordResetConfirmDto request
    ) {
        authService.confirmPasswordReset(request);
        return ResponseEntity.ok(BaseResponse.success());
    }
}
