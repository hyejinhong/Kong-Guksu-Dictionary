package com.kong.kong_dic.domain.auth.service;

import com.kong.kong_dic.common.exception.BaseException;
import com.kong.kong_dic.domain.auth.dto.LoginResponseDto;
import com.kong.kong_dic.domain.auth.dto.SignupRequestDto;
import com.kong.kong_dic.domain.auth.exception.AuthExceptionType;
import com.kong.kong_dic.domain.user.entity.Role;
import com.kong.kong_dic.domain.user.entity.User;
import com.kong.kong_dic.domain.user.repository.UserRepository;
import com.kong.kong_dic.global.jwt.JwtProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtProvider jwtProvider;
    private final RefreshTokenService refreshTokenService;

    public void signup(SignupRequestDto request) throws Exception {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new BaseException(AuthExceptionType.DUPLICATED_USERNAME);
        }

        User newUser = User.builder()
                .username(request.getUsername())
                .password(passwordEncoder.encode(request.getPassword()))
                .nickname(request.getNickname())
                .role(Role.USER)
                .build();

        userRepository.save(newUser);
    }

    @Transactional
    public LoginResponseDto refresh(String refreshToken) {
        // 1. Refresh Token 검증
        try {
            jwtProvider.validateToken(refreshToken);
        } catch (Exception e) {
            throw new BaseException(AuthExceptionType.INVALID_REFRESH_TOKEN);
        }

        // 2. Redis에서 해당 토큰의 소유자 확인
        String username = refreshTokenService.getUsernameByRefreshToken(refreshToken);
        if (username == null) {
            throw new BaseException(AuthExceptionType.INVALID_REFRESH_TOKEN);
        }

        // 3. 사용자 정보 조회
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new BaseException(AuthExceptionType.USER_NOT_FOUND));

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
        } catch (Exception e) {
            log.error(">>> Token verify fail", e);
            return false;
        }
        return true;
    }
}
