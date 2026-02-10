package com.kong.kong_dic_admin.domain.restaurant.notification.redis;

import com.kong.kong_dic.common.dto.NotificationMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

// XADD
@Slf4j
@Component
public class RedisStreamPublisher {

    private final StringRedisTemplate redisTemplate;
    private static final String GLOBAL_STREAM_KY = "server:notifications";

    public RedisStreamPublisher(StringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    public void publish(NotificationMessage message) {
        Map<String, String> map = new HashMap<>();
        map.put("username", message.getUsername());
        map.put("title", message.getTitle());
        map.put("content", message.getContent());
        map.put("type", message.getType());

        redisTemplate.opsForStream().add(GLOBAL_STREAM_KY, map);
        log.info("🔔 [Admin -> Redis] 알림 이벤트 발행 완료: Target={}, Type={}",
                message.getUsername(), message.getType());
    }
}
