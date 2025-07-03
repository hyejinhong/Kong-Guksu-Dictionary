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

        // HandshakeInterceptor에서 "principal"이라는 이름으로 저장한 Principal 객체를 가져옵니다.
        Principal principal = (Principal) headerAccessor.getSessionAttributes().get("principal");

        log.info("📎 Principal 확인 (from Session Attributes): {}", principal);

        // Principal이 유효하고 실제 사용자 이름이 있다면 리스너 시작
        if (principal != null && principal.getName() != null && !principal.getName().isEmpty() && !principal.getName().equals("anonymousUser")) {
            String username = principal.getName();
            log.info("WebSocket connected for user: {}", username);
            redisStreamManager.startListening(username);
        } else {
            log.warn("WebSocket connected without a valid principal in session attributes. Cannot start user-specific stream listener.");
        }
    }
}
