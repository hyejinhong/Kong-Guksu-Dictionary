package com.kong.kong_dic.domain.notification.websocket;

import com.kong.kong_dic.domain.notification.redis.RedisStreamManager;
import com.kong.kong_dic.domain.user.entity.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionSubscribeEvent;

@Slf4j
@Component
@RequiredArgsConstructor
public class WebSocketEventListener {

    private final RedisStreamManager redisStreamManager;

    @EventListener
    public void handleSessionSubscribeEvent(SessionSubscribeEvent event) {
        log.info("🔔 구독 감지됨: {}", event.getMessage());

        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        Object principalObject = headerAccessor.getSessionAttributes().get("principal");
        log.info("###principalObject instance {}", principalObject.getClass().getName());
        if (principalObject instanceof User principal) {
            log.info("📎 Principal 확인 (from SessionSubscribeEvent Session Attributes): {}", principal);

            if (principal.getUsername() != null && !principal.getUsername().isEmpty() && !principal.getUsername().equals("anonymousUser")) {
                String username = principal.getUsername();
                log.info("Redis Stream listener starting for user: {}", username);

                // 구독 이벤트 시점에 Redis Stream 리스너 시작
                redisStreamManager.startListening(username);
            } else {
                log.warn("Subscription event received without a valid principal in session attributes. Cannot start user-specific stream listener. Principal: {}", principal);
            }
        } else {
            log.warn("Subscription event received without a valid Principal object in session attributes. Found: {}", principalObject);
        }
    }
}
