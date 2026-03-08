package com.kong.kong_dic.domain.restaurant.scheduler;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class RankingScheduler {

    private final StringRedisTemplate redisTemplate;
    private static final String DAILY_VIEWS_RANKING_KEY = "restaurant:ranking:views:daily";

    /**
     * 매일 자정(00:00:00)에 실행되는 일간 랭킹 초기화 스케줄러
     */
    @Scheduled(cron = "0 0 0 * * *", zone = "Asia/Seoul")
    public void resetDailyRanking() {
        log.info(">> 자정입니다. 일간 식당 조회수 랭킹(Redis ZSet)을 초기화합니다.");

        try {
            Boolean result = redisTemplate.delete(DAILY_VIEWS_RANKING_KEY);

            if (Boolean.TRUE.equals(result)) {
                log.info(">> 일간 랭킹 초기화 성공: {}", DAILY_VIEWS_RANKING_KEY);
            } else {
                log.info("ℹ>> 초기화할 일간 랭킹 데이터가 없습니다: {}", DAILY_VIEWS_RANKING_KEY);
            }
        } catch (Exception e) {
            log.error(">> 일간 랭킹 초기화 중 오류 발생", e);
        }
    }
}