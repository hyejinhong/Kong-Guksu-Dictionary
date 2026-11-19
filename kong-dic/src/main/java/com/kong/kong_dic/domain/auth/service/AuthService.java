package com.kong.kong_dic.domain.auth.service;

import com.kong.kong_dic.common.exception.BaseException;
import com.kong.kong_dic.domain.auth.dto.FindUsernameRequestDto;
import com.kong.kong_dic.domain.auth.dto.FindUsernameResponseDto;
import com.kong.kong_dic.domain.auth.dto.LoginResponseDto;
import com.kong.kong_dic.domain.auth.dto.SignupRequestDto;
import com.kong.kong_dic.domain.auth.dto.PasswordResetRequestDto;
import com.kong.kong_dic.domain.auth.dto.PasswordResetConfirmDto;
import com.kong.kong_dic.domain.auth.exception.AuthExceptionType;
import com.kong.kong_dic.domain.user.entity.Role;
import com.kong.kong_dic.domain.user.entity.SeasoningPreference;
import com.kong.kong_dic.domain.user.entity.User;
import com.kong.kong_dic.domain.user.exception.UserExceptionType;
import com.kong.kong_dic.domain.user.repository.UserRepository;
import com.kong.kong_dic.global.config.CorsProperties;
import com.kong.kong_dic.global.jwt.JwtProvider;
import com.kong.kong_dic.global.security.SecurityAuditLogger;
import com.kong.kong_dic.global.service.RedisService;
import com.kong.kong_dic.global.service.EmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtProvider jwtProvider;
    private final RefreshTokenService refreshTokenService;
    private final RedisService redisService;
    private final EmailService emailService;
    private final CorsProperties corsProperties;

    private static final String PASSWORD_RESET_TOKEN_PREFIX = "PR:";
    private static final String PASSWORD_RESET_COOLDOWN_PREFIX = "EMAIL_COOLDOWN:RESET:";
    private static final long PASSWORD_RESET_EXPIRATION_TIME = 15; // 15 minutes
    private static final long PASSWORD_RESET_COOLDOWN_SECONDS = 60; // 60 seconds
    private static final Set<String> RESERVED_IDENTIFIERS = Set.of(
            "me", "admin", "administrator", "root", "system", "null", "undefined"
    );

    public void signup(SignupRequestDto request) throws Exception {
        validateSignupInput(request);

        String trimmedUsername = request.getUsername().trim();
        String trimmedNickname = request.getNickname() != null && !request.getNickname().isBlank()
                ? request.getNickname().trim()
                : trimmedUsername;

        if (userRepository.existsByUsernameIgnoreCase(trimmedUsername)) {
            throw new BaseException(AuthExceptionType.DUPLICATED_USERNAME);
        }

        if (request.getEmail() != null && !request.getEmail().isBlank()
                && userRepository.existsByEmail(request.getEmail().trim())) {
            throw new BaseException(AuthExceptionType.DUPLICATED_EMAIL);
        }

        User newUser = User.builder()
                .username(trimmedUsername)
                .password(passwordEncoder.encode(request.getPassword()))
                .nickname(trimmedNickname)
                .email(request.getEmail() != null && !request.getEmail().isBlank() ? request.getEmail().trim() : null)
                .role(Role.USER)
                .avatarVariant("beam")
                .avatarSeed(trimmedNickname)
                .seasoningPreference(request.getSeasoningPreference() != null ? request.getSeasoningPreference() : SeasoningPreference.NONE)
                .build();

        userRepository.save(newUser);
    }

    private void validateSignupInput(SignupRequestDto request) {
        if (request == null || request.getUsername() == null || request.getUsername().isBlank()) {
            throw new BaseException(UserExceptionType.INVALID_INPUT, "아이디를 입력해주세요.");
        }
        String trimmedUsername = request.getUsername().trim();
        if (trimmedUsername.length() < 3 || trimmedUsername.length() > 30
                || RESERVED_IDENTIFIERS.contains(trimmedUsername.toLowerCase())) {
            throw new BaseException(UserExceptionType.INVALID_INPUT, "사용할 수 없는 아이디입니다.");
        }
        if (request.getPassword() == null || request.getPassword().isBlank() || request.getPassword().length() < 4) {
            throw new BaseException(UserExceptionType.INVALID_INPUT, "비밀번호는 4자 이상이어야 합니다.");
        }
        if (request.getNickname() != null && !request.getNickname().isBlank()) {
            String trimmedNickname = request.getNickname().trim();
            if (trimmedNickname.length() > 20 || RESERVED_IDENTIFIERS.contains(trimmedNickname.toLowerCase())) {
                throw new BaseException(UserExceptionType.INVALID_INPUT, "사용할 수 없는 닉네임입니다.");
            }
        }
    }

    @Transactional
    public LoginResponseDto refresh(String refreshToken) {
        // 1. Refresh Token 서명/만료 및 토큰 타입 검증
        try {
            jwtProvider.validateToken(refreshToken);
            if (!jwtProvider.isRefreshToken(refreshToken)) {
                SecurityAuditLogger.logWarn("REFRESH_TOKEN_REJECTED", null, "N/A", "POST /auth/refresh", "Non-refresh token used for refresh");
                throw new BaseException(AuthExceptionType.INVALID_REFRESH_TOKEN);
            }
        } catch (BaseException e) {
            throw e;
        } catch (Exception e) {
            SecurityAuditLogger.logWarn("REFRESH_TOKEN_REJECTED", null, "N/A", "POST /auth/refresh", "Invalid or expired refresh token: " + e.getMessage());
            throw new BaseException(AuthExceptionType.INVALID_REFRESH_TOKEN);
        }

        // 2. Redis에서 해당 토큰의 소유자 확인
        String username = refreshTokenService.getUsernameByRefreshToken(refreshToken);
        if (username == null) {
            SecurityAuditLogger.logWarn("REFRESH_TOKEN_REJECTED", null, "N/A", "POST /auth/refresh", "Refresh token not found in Redis");
            throw new BaseException(AuthExceptionType.INVALID_REFRESH_TOKEN);
        }

        // 3. 사용자 정보 조회 및 계정 활성화 상태 검증
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new BaseException(AuthExceptionType.USER_NOT_FOUND));

        if (!user.isEnabled()) {
            refreshTokenService.deleteRefreshToken(refreshToken);
            SecurityAuditLogger.logWarn("REFRESH_TOKEN_REJECTED", username, "N/A", "POST /auth/refresh", "Disabled account attempted token refresh");
            throw new BaseException(AuthExceptionType.INVALID_REFRESH_TOKEN);
        }

        // 4. 새로운 토큰 쌍 생성 (Refresh Token Rotation)
        LoginResponseDto response = jwtProvider.generateToken(user);

        // 5. 이전 Refresh Token 삭제 및 새로운 Refresh Token 저장
        refreshTokenService.deleteRefreshToken(refreshToken);
        refreshTokenService.saveRefreshToken(username, response.getRefreshToken());

        return response;
    }

    @Transactional
    public void logout(String refreshToken) {
        refreshTokenService.deleteRefreshToken(refreshToken);
    }

    public boolean verifyToken(String token) {
        try {
            jwtProvider.validateToken(token);
            if (!jwtProvider.isAccessToken(token)) {
                SecurityAuditLogger.logWarn("TOKEN_VERIFY_FAILED", null, "N/A", "GET /auth/verify-token", "Non-access token provided");
                return false;
            }
            String username = jwtProvider.getUsernameFromToken(token);
            if (username == null) {
                return false;
            }
            return userRepository.findByUsername(username)
                    .map(User::isEnabled)
                    .orElse(false);
        } catch (Exception e) {
            SecurityAuditLogger.logWarn("TOKEN_VERIFY_FAILED", null, "N/A", "GET /auth/verify-token", e.getMessage());
            return false;
        }
    }

    @Transactional
    public void requestPasswordReset(PasswordResetRequestDto request, String origin) throws Exception {
        User user = userRepository.findByUsernameIgnoreCaseAndEmail(request.getUsername(), request.getEmail())
                .orElseThrow(() -> new BaseException(AuthExceptionType.USER_EMAIL_MISMATCH));

        String cooldownKey = PASSWORD_RESET_COOLDOWN_PREFIX + user.getEmail();
        if (redisService.getData(cooldownKey) != null) {
            throw new BaseException(AuthExceptionType.EMAIL_SEND_TOO_FREQUENT);
        }

        String token = java.util.UUID.randomUUID().toString();

        redisService.setData(
                PASSWORD_RESET_TOKEN_PREFIX + token,
                user.getUsername(),
                PASSWORD_RESET_EXPIRATION_TIME,
                java.util.concurrent.TimeUnit.MINUTES
        );
        redisService.setData(
                cooldownKey,
                "1",
                PASSWORD_RESET_COOLDOWN_SECONDS,
                java.util.concurrent.TimeUnit.SECONDS
        );

        String frontUrl = corsProperties.resolveAllowedOrigin(origin);
        String resetLink = frontUrl + "/reset-password?token=" + token;

        emailService.sendPasswordResetEmail(user.getEmail(), resetLink);
    }

    @Transactional
    public void confirmPasswordReset(PasswordResetConfirmDto request) {
        if (request == null || request.getNewPassword() == null
                || request.getNewPassword().isBlank() || request.getNewPassword().length() < 4) {
            throw new BaseException(UserExceptionType.INVALID_INPUT, "비밀번호는 4자 이상이어야 합니다.");
        }

        String username = redisService.getData(PASSWORD_RESET_TOKEN_PREFIX + request.getToken());
        if (username == null) {
            throw new BaseException(AuthExceptionType.INVALID_RESET_TOKEN);
        }

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new BaseException(AuthExceptionType.USER_NOT_FOUND));

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        redisService.deleteData(PASSWORD_RESET_TOKEN_PREFIX + request.getToken());
        refreshTokenService.deleteAllByUsername(user.getUsername());
    }

    @Transactional(readOnly = true)
    public FindUsernameResponseDto findUsername(FindUsernameRequestDto request) {
        if (request.getEmail() == null || request.getEmail().isBlank()) {
            throw new BaseException(AuthExceptionType.USER_NOT_FOUND);
        }

        User user = userRepository.findByEmail(request.getEmail().trim())
                .orElseThrow(() -> new BaseException(AuthExceptionType.USER_NOT_FOUND));

        String masked = maskUsername(user.getUsername());
        String registeredAtStr = user.getRegisteredAt() != null ? user.getRegisteredAt().toString() : "";

        return FindUsernameResponseDto.builder()
                .maskedUsername(masked)
                .registeredAt(registeredAtStr)
                .build();
    }

    private String maskUsername(String username) {
        if (username == null || username.isEmpty()) {
            return "";
        }
        int len = username.length();
        if (len == 1) {
            return "*";
        }
        if (len == 2) {
            return username.charAt(0) + "*";
        }
        if (len <= 4) {
            return username.substring(0, 1) + "*".repeat(len - 1);
        }
        if (len <= 7) {
            return username.substring(0, 2) + "*".repeat(len - 2);
        }
        return username.substring(0, 2) + "*".repeat(len - 4) + username.substring(len - 2);
    }
}
