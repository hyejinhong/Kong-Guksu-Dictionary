package com.kong.kong_dic.domain.notification.redis;

import com.google.gson.Gson;
import com.kong.kong_dic.domain.notification.dto.NotificationMessage;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.connection.stream.*;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.stream.StreamListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.List;
import java.util.Map;

@Component
public class RedisStreamListener implements StreamListener<String, MapRecord<String, Object, Object>> {

    private final StringRedisTemplate redisTemplate;
    private final SimpMessagingTemplate messagingTemplate;
    private final Gson gson = new Gson();
    private static final String STREAM_KEY = "notifications";
    private static final String GROUP = "notification-group";
    private static final String CONSUMER_NAME = "kong-server";

    @Autowired
    public RedisStreamListener(StringRedisTemplate redisTemplate, SimpMessagingTemplate messagingTemplate) {
        this.redisTemplate = redisTemplate;
        this.messagingTemplate = messagingTemplate;
    }

    @PostConstruct
    public void init() {
        try {
            // Consumer 그룹 생성 (이미 존재하면 예외 발생 무시)
            redisTemplate.opsForStream().createGroup(STREAM_KEY, ReadOffset.latest(), GROUP);
        } catch (Exception ignored) {}

        Thread listenerThread = new Thread(() -> {
            while (true) {
                try {
                    List<MapRecord<String, Object, Object>> messages = redisTemplate.opsForStream().read(
                            Consumer.from(GROUP, CONSUMER_NAME),
                            StreamReadOptions.empty().block(Duration.ofSeconds(2)),
                            StreamOffset.create(STREAM_KEY, ReadOffset.lastConsumed())
                    );

                    if (messages != null) {
                        for (MapRecord<String, Object, Object> message : messages) {
                            onMessage(message); // 처리
                        }
                    }
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }
        });

        listenerThread.setDaemon(true);
        listenerThread.start();
    }

    @Override
    public void onMessage(MapRecord<String, Object, Object> message) {
        Map<Object, Object> body = message.getValue();
        String json = body.get("message").toString();
        NotificationMessage notification = gson.fromJson(json, NotificationMessage.class);

        // WebSocket으로 전송
        messagingTemplate.convertAndSend("/topic/notifications/" + notification.getUserId(), notification);
    }
}
