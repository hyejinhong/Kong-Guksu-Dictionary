package com.kong.kong_dic.domain.notification.redis;

import com.kong.kong_dic.domain.notification.dto.NotificationMessage;
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

    public RedisStreamPublisher(StringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    public void publish(NotificationMessage message) {
        Map<String, String> map = new HashMap<>();
        map.put("username", message.getUsername());
        map.put("title", message.getTitle());
        map.put("content", message.getContent());
        map.put("type", message.getType());

        log.info("@@ published : {}", message.toString());
        redisTemplate.opsForStream().add("notifications:" + message.getUsername(), map);
    }
}
