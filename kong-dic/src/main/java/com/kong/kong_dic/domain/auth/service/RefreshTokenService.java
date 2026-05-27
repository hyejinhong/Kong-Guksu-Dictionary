package com.kong.kong_dic.domain.auth.service;

import com.kong.kong_dic.global.service.RedisService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class RefreshTokenService {

    private final RedisService redisService;

    @Value("${jwt.refresh-expiration}")
    private long refreshExpirationTime;

    private static final String REFRESH_TOKEN_PREFIX = "RT:";

    public void saveRefreshToken(String username, String refreshToken) {
        redisService.setData(
                REFRESH_TOKEN_PREFIX + refreshToken,
                username,
                refreshExpirationTime,
                TimeUnit.MILLISECONDS
        );
    }

    public String getUsernameByRefreshToken(String refreshToken) {
        return redisService.getData(REFRESH_TOKEN_PREFIX + refreshToken);
    }

    public void deleteRefreshToken(String refreshToken) {
        redisService.deleteData(REFRESH_TOKEN_PREFIX + refreshToken);
    }
}
