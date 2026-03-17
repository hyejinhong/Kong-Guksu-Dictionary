package com.kong.kong_dic.domain.notification.redis;

import com.kong.kong_dic.common.dto.NotificationMessage;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataAccessException;
import org.springframework.data.redis.connection.stream.*;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@Slf4j
@Component
@RequiredArgsConstructor
public class RedisStreamManager {

    private final StringRedisTemplate redisTemplate;
    private final SimpMessagingTemplate messagingTemplate;

    // 단일 스레드로 글로벌 스트림 처리
    private final ExecutorService executorService = Executors.newSingleThreadExecutor();

    private static final String GROUP = "notification-group"; // 모든 사용자 스트림에 동일한 그룹 사용

    // 모든 알림이 모이는 글로벌 스트림 키
    private static final String GLOBAL_STREAM_KEY = "server:notifications";
    private static final String GROUP_NAME = "notification-service-group";
    private static final String CONSUMER_NAME = "instance-1"; // 다중 서버 환경에서는 UUID 등으로 유니크하게 설정 필요

    private volatile boolean isRunning = true;

    @PostConstruct
    public void startGlobalListener() {
        // 1. 컨슈머 그룹 생성 (없으면 생성)
        createStreamGroup(GLOBAL_STREAM_KEY, GROUP_NAME);

        // 2. 리스너 스레드 실행
        executorService.submit(this::consumeStream);
        log.info("🚀 글로벌 Redis Stream 리스너가 시작되었습니다. (Key: {})", GLOBAL_STREAM_KEY);
    }

    /**
     * 스트림 그룹 생성 로직
     */
    private void createStreamGroup(String key, String group) {
        try {
            // 스트림이 없으면 생성하면서 그룹도 같이 만듬 (MKSTREAM 옵션과 유사 효과를 위해 0-0 부터 읽기)
            redisTemplate.opsForStream().createGroup(key, ReadOffset.from("0-0"), group);
            log.info("Redis Stream 그룹 생성 완료: {} / {}", key, group);
        } catch (DataAccessException e) {
            // 그룹이 이미 존재하면 RedisBusyException 발생 -> 무시하고 진행
            log.info("Redis Stream 그룹이 이미 존재합니다. (Skipping creation)");
        }
    }

    /**
     * 실제 메시지를 읽어오는 무한 루프 (단일 스레드)
     */
    private void consumeStream() {
        while (isRunning) {
            try {
                // 글로벌 스트림에서 메시지 읽기 (블로킹 2초)
                List<MapRecord<String, Object, Object>> messages = redisTemplate.opsForStream().read(
                        Consumer.from(GROUP_NAME, CONSUMER_NAME),
                        StreamReadOptions.empty().block(Duration.ofSeconds(2)).count(10),
                        StreamOffset.create(GLOBAL_STREAM_KEY, ReadOffset.lastConsumed())
                );

                if (messages != null && !messages.isEmpty()) {
                    for (MapRecord<String, Object, Object> message : messages) {
                        processMessage(message);
                        // 처리 후 ACK
                        redisTemplate.opsForStream().acknowledge(GROUP_NAME, message);
                    }
                }
            } catch (Exception e) {
                log.error("Redis Stream 소비 중 에러 발생", e);
                try {
                    Thread.sleep(1000); // 에러 발생 시 잠시 대기 (CPU 폭주 방지)
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    isRunning = false;
                }
            }
        }
    }


    /**
     * 메시지 처리 및 WebSocket 전송
     */
    private void processMessage(MapRecord<String, Object, Object> message) {
        try {
            Map<Object, Object> body = message.getValue();

            // [중요] 메시지 안에 수신자(username) 정보가 반드시 포함되어야 함
            String targetUsername = (String) body.get("username");
            String title = (String) body.get("title");
            String content = (String) body.get("content");
            String type = (String) body.get("type");

            if (targetUsername == null) {
                log.warn("수신자(username)가 없는 알림 메시지는 무시합니다. ID: {}", message.getId());
                return;
            }

            NotificationMessage notification = new NotificationMessage(targetUsername, title, content, type);

            // 해당 유저의 전용 토픽으로 WebSocket 전송
            // (사용자가 접속해 있다면 받고, 아니면 그냥 증발 - 실시간 알림 특성)
            String destination = "/topic/notifications/" + targetUsername;
            messagingTemplate.convertAndSend(destination, notification);

            log.debug("알림 전송 완료 -> User: {}, Dest: {}", targetUsername, destination);

        } catch (Exception e) {
            log.error("알림 메시지 처리 실패: {}", e.getMessage(), e);
        }
    }

    @PreDestroy
    public void shutdown() {
        isRunning = false;
        executorService.shutdownNow();
        log.info("🛑 Redis Stream 리스너가 종료되었습니다.");
    }
}