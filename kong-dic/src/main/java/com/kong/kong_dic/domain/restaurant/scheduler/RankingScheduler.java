package com.kong.kong_dic.domain.restaurant.scheduler;

import com.kong.kong_dic.domain.restaurant.entity.Restaurant;
import com.kong.kong_dic.domain.restaurant.repository.RestaurantRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.Optional;
import java.util.Set;

@Slf4j
@Component
@RequiredArgsConstructor
public class RankingScheduler {

    private final StringRedisTemplate redisTemplate;
    private final RestaurantRepository restaurantRepository;
    private static final String DAILY_VIEWS_RANKING_KEY = "restaurant:ranking:views:daily";
    private static final String DAILY_VIEWS_RANKING_CACHE_KEY = "restaurant:ranking:top10_cache:daily";
    private static final String ZSET_VIEWS_ALL_KEY = "restaurant:ranking:views";

    /**
     * 매일 자정(00:00:00)에 실행되는 일간 랭킹 초기화 스케줄러
     */
    @Scheduled(cron = "0 0 0 * * *", zone = "Asia/Seoul")
    public void resetDailyRanking() {
        log.info(">> 자정입니다. 일간 식당 조회수 랭킹(Redis ZSet)을 초기화합니다.");

        try {
            redisTemplate.delete(DAILY_VIEWS_RANKING_KEY);
            redisTemplate.delete(DAILY_VIEWS_RANKING_CACHE_KEY);
            log.info(">> 일간 랭킹 초기화 성공");
        } catch (Exception e) {
            log.error(">> 일간 랭킹 초기화 중 오류 발생", e);
        }
    }

    @Scheduled(cron = "0 */5 * * * *", zone = "Asia/Seoul") // 5분마다로 주기 조정 (부하 감소)
    public void syncViewCountToDB() {
        log.info(">> 조회수 Redis → DB 동기화 시작");

        Set<String> restaurantIds = redisTemplate.opsForZSet()
                .range(ZSET_VIEWS_ALL_KEY, 0, -1);

        if (restaurantIds == null || restaurantIds.isEmpty()) {
            log.info(">> 동기화할 조회수 데이터 없음");
            return;
        }

        int syncCount = 0;
        int removeCount = 0;

        for (String idStr : restaurantIds) {
            try {
                Long id = Long.valueOf(idStr);
                Double score = redisTemplate.opsForZSet().score(ZSET_VIEWS_ALL_KEY, idStr);
                
                if (score == null) continue;
                long redisViewCount = score.longValue();

                Optional<Restaurant> restaurantOpt = restaurantRepository.findById(id);
                
                if (restaurantOpt.isPresent()) {
                    Restaurant restaurant = restaurantOpt.get();
                    // 데이터 정합성 보호: Redis 값이 DB 값보다 클 경우에만 업데이트
                    // (Redis 초기화 시 DB 데이터가 0으로 덮어씌워지는 것 방지)
                    if (redisViewCount > restaurant.getViewCount()) {
                        restaurant.setViewCount(redisViewCount);
                        restaurantRepository.save(restaurant);
                        syncCount++;
                    }
                } else {
                    // DB에 없는 식당이 Redis에 있으면 삭제 (유령 데이터 정리)
                    redisTemplate.opsForZSet().remove(ZSET_VIEWS_ALL_KEY, idStr);
                    redisTemplate.opsForZSet().remove(DAILY_VIEWS_RANKING_KEY, idStr);
                    removeCount++;
                    log.warn(">> 존재하지 않는 식당 ID({}) Redis에서 삭제 완료", idStr);
                }
            } catch (Exception e) {
                log.error(">> 조회수 동기화 실패 - id: {}", idStr, e);
            }
        }

        log.info(">> 조회수 DB 동기화 완료 (업데이트: {}건, 삭제: {}건)", syncCount, removeCount);
    }
}