package com.kong.kong_dic.domain.notification.redis;

import com.google.gson.Gson;
import com.kong.kong_dic.domain.notification.dto.NotificationMessage;
import jakarta.annotation.PreDestroy;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataAccessException;
import org.springframework.data.redis.connection.stream.*;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@Slf4j
@Component
public class RedisStreamManager { // 클래스 이름 변경 제안: Listener 대신 Manager

    private final StringRedisTemplate redisTemplate;
    private final SimpMessagingTemplate messagingTemplate;

    // 사용자별 스트림 리스너 스레드를 관리할 맵
    private final Map<String, StreamConsumerRunner> consumerRunners = new ConcurrentHashMap<>();
    // 스레드 풀
    private final ExecutorService executorService = Executors.newCachedThreadPool(); // 필요에 따라 스레드 생성/재활용

    private static final String GROUP = "notification-group"; // 모든 사용자 스트림에 동일한 그룹 사용

    @Autowired
    public RedisStreamManager(StringRedisTemplate redisTemplate, SimpMessagingTemplate messagingTemplate) {
        this.redisTemplate = redisTemplate;
        this.messagingTemplate = messagingTemplate;
    }

    /**
     * 특정 사용자를 위한 Redis Stream 리스너를 시작합니다.
     * @param username 리스닝할 사용자의 이름
     */
    public void startListening(String username) {
        String streamKey = "notifications:" + username;
        String consumerName = "consumer-" + username;

        if (consumerRunners.containsKey(username)) {
            log.warn("User {} already has an active stream listener.", username);
            return;
        }

        try {
            redisTemplate.opsForStream().createGroup(streamKey, ReadOffset.from("0-0"), GROUP);
            log.info("Created Redis Stream group '{}' for stream '{}'", GROUP, streamKey);
        } catch (DataAccessException e) {
            Throwable rootCause = e.getRootCause();

            if (rootCause instanceof io.lettuce.core.RedisBusyException) {
                log.info("Redis Stream group '{}' for stream '{}' already exists. (Caught RedisBusyException)", GROUP, streamKey);
            } else {
                // 다른 종류의 Redis 관련 예외 처리
                String errorMessage = rootCause != null ? rootCause.getMessage() : e.getMessage();
                log.error("Unhandled Redis error creating Stream group for stream '{}': {}. Original exception: {}",
                        streamKey, errorMessage, e.getClass().getSimpleName(), e); // 전체 스택 트레이스도 다시 찍기
            }
        } catch (Exception e) { // 혹시 DataAccessException 외의 다른 예외가 발생할 경우를 대비
            log.error("Unexpected error creating Redis Stream group for stream '{}': {}", streamKey, e.getMessage(), e);
        }

        StreamConsumerRunner runner = new StreamConsumerRunner(streamKey, GROUP, consumerName);
        executorService.submit(runner);
        consumerRunners.put(username, runner);
        log.info("Started Redis Stream listener for user: {}", username);
    }
    /**
     * 특정 사용자를 위한 Redis Stream 리스너를 중지합니다.
     * @param username 중지할 사용자의 이름
     */
    public void stopListening(String username) {
        StreamConsumerRunner runner = consumerRunners.remove(username);
        if (runner != null) {
            runner.stop(); // 스레드 중지 요청
            log.info("Stopped Redis Stream listener for user: {}", username);
        }
    }

    @PreDestroy
    public void shutdown() {
        // 애플리케이션 종료 시 모든 리스너 중지
        consumerRunners.values().forEach(StreamConsumerRunner::stop);
        executorService.shutdownNow(); // 스레드 풀 즉시 종료
        log.info("Shutting down all Redis Stream listeners and executor service.");
    }

    // 내부 클래스로 각 사용자 스트림을 듣는 Runner 정의
    private class StreamConsumerRunner implements Runnable {
        private final String streamKey;
        private final String groupName;
        private final String consumerName;
        private volatile boolean running = true; // 스레드 중지를 위한 플래그

        public StreamConsumerRunner(String streamKey, String groupName, String consumerName) {
            this.streamKey = streamKey;
            this.groupName = groupName;
            this.consumerName = consumerName;
        }

        public void stop() {
            this.running = false;
        }

        @Override
        public void run() {
            log.info("StreamConsumerRunner for {} started.", streamKey);
            while (running) {
                try {
                    // 메시지 읽기: 지정된 컨슈머 그룹과 컨슈머 이름으로, BLOCK 옵션 사용
                    List<MapRecord<String, Object, Object>> messages = redisTemplate.opsForStream().read(
                            Consumer.from(groupName, consumerName),
                            StreamReadOptions.empty().block(Duration.ofSeconds(1)).count(10), // 최대 10개 메시지, 1초 블로킹
                            StreamOffset.create(streamKey, ReadOffset.lastConsumed()) // 마지막으로 읽은 메시지부터 시작
                    );

                    if (messages != null && !messages.isEmpty()) {
                        for (MapRecord<String, Object, Object> message : messages) {
                            processMessage(message); // 메시지 처리
                            // 메시지 처리 후 ACK (필수)
                            redisTemplate.opsForStream().acknowledge(groupName, message);
                        }
                    }
                } catch (Exception e) {
                    log.error("Error in Redis Stream listener for {}: {}", streamKey, e.getMessage());
                    // 오류 발생 시 잠시 대기하여 CPU 과부하 방지
                    try {
                        Thread.sleep(1000);
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                        log.warn("StreamConsumerRunner for {} interrupted during error pause.", streamKey);
                        running = false;
                    }
                }
            }
            log.info("StreamConsumerRunner for {} stopped.", streamKey);
        }

        private void processMessage(MapRecord<String, Object, Object> message) {
            Map<Object, Object> body = message.getValue();
            String username = (String) body.get("username");
            String title = (String) body.get("title");
            String content = (String) body.get("content");
            String type = (String) body.get("type");

            NotificationMessage notification = new NotificationMessage(username, title, content, type);

            log.info("> 발행 경로 : {}", "/topic/notifications/" + notification.getUsername());
            log.info("> 발행 메시지 : {}", notification.toString());
            // WebSocket으로 전송
            messagingTemplate.convertAndSend("/topic/notifications/" + notification.getUsername(), notification);
        }
    }
}