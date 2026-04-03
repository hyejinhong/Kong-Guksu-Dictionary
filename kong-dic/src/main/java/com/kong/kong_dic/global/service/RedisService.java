package com.kong.kong_dic.global.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.util.Set;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class RedisService {

    private final StringRedisTemplate redisTemplate;

    /**
     * 랭킹 점수 증가 (ZINCRBY)
     */
    public void incrementScore(String key, String value, double score) {
        redisTemplate.opsForZSet().incrementScore(key, value, score);
    }

    /**
     * 상위 랭킹 조회 (ZREVRANGE)
     * @param start 시작 순위 (0부터)
     * @param end 끝 순위
     * @return Value Set (식당 ID 목록)
     */
    public Set<String> getTopRanking(String key, int start, int end) {
        // 점수가 높은 순으로 조회 (Reverse Range)
        return redisTemplate.opsForZSet().reverseRange(key, start, end);
    }

    /**
     * 키 만료 시간 설정 (일간 랭킹)
     */
    public void setExpire(String key, long timeout) {
        redisTemplate.expire(key, timeout, TimeUnit.SECONDS);
    }
}