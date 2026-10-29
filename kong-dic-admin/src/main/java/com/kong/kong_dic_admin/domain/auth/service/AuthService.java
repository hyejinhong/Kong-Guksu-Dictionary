package com.kong.kong_dic_admin.domain.auth.service;

import com.kong.kong_dic_admin.global.jwt.JwtProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final JwtProvider jwtProvider;

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
