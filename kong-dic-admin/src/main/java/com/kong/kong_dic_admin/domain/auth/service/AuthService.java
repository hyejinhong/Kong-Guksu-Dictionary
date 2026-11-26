package com.kong.kong_dic_admin.domain.auth.service;

import com.kong.kong_dic_admin.global.jwt.JwtProvider;
import com.kong.kong_dic_admin.global.security.SecurityAuditLogger;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final JwtProvider jwtProvider;

    public boolean verifyToken(String token) {
        try {
            jwtProvider.validateToken(token);
            if (!jwtProvider.isAccessToken(token)) {
                SecurityAuditLogger.logWarn("TOKEN_VERIFY_FAILED", null, "N/A", "GET /auth/verify-token", "Non-access token provided");
                return false;
            }
        } catch (Exception e) {
            SecurityAuditLogger.logWarn("TOKEN_VERIFY_FAILED", null, "N/A", "GET /auth/verify-token", e.getMessage());
            return false;
        }
        return true;
    }
}
