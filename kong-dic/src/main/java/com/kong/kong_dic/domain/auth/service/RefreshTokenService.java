package com.kong.kong_dic.domain.auth.service;

import com.kong.kong_dic.global.service.RedisService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Set;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class RefreshTokenService {

    private final RedisService redisService;

    @Value("${jwt.refresh-expiration}")
    private long refreshExpirationTime;

    private static final String REFRESH_TOKEN_PREFIX = "RT:";
    private static final String USER_REFRESH_TOKENS_PREFIX = "RT_USER:";

    public void saveRefreshToken(String username, String refreshToken) {
        redisService.setData(
                REFRESH_TOKEN_PREFIX + refreshToken,
                username,
                refreshExpirationTime,
                TimeUnit.MILLISECONDS
        );
        redisService.addSetData(
                USER_REFRESH_TOKENS_PREFIX + username,
                refreshToken,
                refreshExpirationTime,
                TimeUnit.MILLISECONDS
        );
    }

    public String getUsernameByRefreshToken(String refreshToken) {
        return redisService.getData(REFRESH_TOKEN_PREFIX + refreshToken);
    }

    public void deleteRefreshToken(String refreshToken) {
        String username = getUsernameByRefreshToken(refreshToken);
        redisService.deleteData(REFRESH_TOKEN_PREFIX + refreshToken);
        if (username != null) {
            redisService.removeSetData(USER_REFRESH_TOKENS_PREFIX + username, refreshToken);
        }
    }

    public void deleteAllByUsername(String username) {
        if (username == null || username.isBlank()) {
            return;
        }
        Set<String> tokens = redisService.getSetData(USER_REFRESH_TOKENS_PREFIX + username);
        if (tokens != null) {
            for (String token : tokens) {
                redisService.deleteData(REFRESH_TOKEN_PREFIX + token);
            }
        }
        redisService.deleteData(USER_REFRESH_TOKENS_PREFIX + username);
    }
}
