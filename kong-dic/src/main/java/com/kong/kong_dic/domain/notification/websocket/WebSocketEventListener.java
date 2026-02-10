package com.kong.kong_dic.domain.notification.websocket;

import com.kong.kong_dic.domain.notification.redis.RedisStreamManager;
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
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());

        // 어떤 사용자가 어떤 경로를 구독했는지 로그만 남김
        log.info("🔔 WebSocket 구독 감지 -> Destination: {}, SessionId: {}",
                headerAccessor.getDestination(),
                headerAccessor.getSessionId());
    }
}
