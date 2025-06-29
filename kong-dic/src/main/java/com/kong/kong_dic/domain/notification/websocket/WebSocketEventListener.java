package com.kong.kong_dic.domain.notification.websocket;

import com.kong.kong_dic.domain.notification.redis.RedisStreamManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionSubscribeEvent;

import java.security.Principal;

@Slf4j
@Component
@RequiredArgsConstructor
public class WebSocketEventListener {

    private final RedisStreamManager redisStreamManager;

    @EventListener
    public void handleSessionSubscribeEvent(SessionSubscribeEvent event) {
        log.info("🔔 구독 감지됨: {}", event.getMessage());
    }

    @EventListener
    public void handleSessionConnected(SessionConnectedEvent event) {
        log.info("🔗 WebSocket 연결 감지됨");
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        Principal principal = headerAccessor.getUser(); // 현재 WebSocket 세션의 사용자 인증 정보
        log.info("📎 Principal 확인: {}", principal);

        if (principal != null) {
            String username = principal.getName(); // 인증된 사용자 이름 가져오기
            log.info("WebSocket connected for user: {}", username);
            // 해당 사용자의 Redis Stream 리스너 시작
            redisStreamManager.startListening(username);
        } else {
            log.warn("WebSocket connected without a principal. Cannot start user-specific stream listener.");
        }
    }
}
