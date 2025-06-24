package com.kong.kong_dic.domain.notification.redis;

import com.kong.kong_dic.domain.notification.dto.NotificationMessage;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

// XADD
@Component
public class RedisStreamPublisher {

    private final StringRedisTemplate redisTemplate;

    public RedisStreamPublisher(StringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    public void publish(NotificationMessage message) {
        Map<String, String> map = new HashMap<>();
        map.put("userId", message.getUserId());
        map.put("content", message.getContent());
        map.put("type", message.getType());

        redisTemplate.opsForStream().add("notifications:" + message.getUserId(), map);
    }
}
