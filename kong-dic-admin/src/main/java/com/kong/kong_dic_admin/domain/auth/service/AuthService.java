package com.kong.kong_dic_admin.domain.auth.service;

import com.kong.kong_dic.common.exception.BaseException;
import com.kong.kong_dic_admin.domain.auth.dto.SignupRequestDto;
import com.kong.kong_dic_admin.domain.auth.exception.AuthExceptionType;
import com.kong.kong_dic_admin.domain.user.entity.Role;
import com.kong.kong_dic_admin.domain.user.entity.User;
import com.kong.kong_dic_admin.domain.user.repository.UserRepository;
import com.kong.kong_dic_admin.global.jwt.JwtProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtProvider jwtProvider;

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
