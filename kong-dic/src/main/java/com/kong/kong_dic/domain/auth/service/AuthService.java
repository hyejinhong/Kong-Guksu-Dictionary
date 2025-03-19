package com.kong.kong_dic.domain.auth.service;

import com.kong.kong_dic.domain.auth.dto.LoginRequestDto;
import com.kong.kong_dic.domain.auth.dto.LoginResponseDto;
import com.kong.kong_dic.domain.auth.dto.SignupRequestDto;
import com.kong.kong_dic.domain.user.entity.Role;
import com.kong.kong_dic.domain.user.entity.User;
import com.kong.kong_dic.domain.user.repository.UserRepository;
import com.kong.kong_dic.global.jwt.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    public void signup(SignupRequestDto request) throws Exception {
        if (userRepository.existsByUsername(request.getUsername())) {
            // TODO
            throw new Exception();
        }

        User newUser = User.builder()
                .username(request.getUsername())
                .password(passwordEncoder.encode(request.getPassword()))
                .nickname(request.getNickname())
                .role(Role.USER)
                .build();

        userRepository.save(newUser);
    }

    public LoginResponseDto authenticate(LoginRequestDto request) {
        // 사용자 검증
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword()));

        // 사용자 정보 조회
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new UsernameNotFoundException("사용자를 찾을 수 없습니다."));

        // JWT 생성
        String token = jwtTokenProvider.generateToken(user);

        return new LoginResponseDto(token);
    }
}
