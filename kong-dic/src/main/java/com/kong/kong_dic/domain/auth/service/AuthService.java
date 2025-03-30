package com.kong.kong_dic.domain.auth.service;

import com.kong.kong_dic.domain.auth.dto.SignupRequestDto;
import com.kong.kong_dic.domain.auth.exception.AuthExceptionType;
import com.kong.kong_dic.domain.user.entity.Role;
import com.kong.kong_dic.domain.user.entity.User;
import com.kong.kong_dic.domain.user.repository.UserRepository;
import com.kong.kong_dic.global.exception.BaseException;
import com.kong.kong_dic.global.jwt.JwtProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

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
}
