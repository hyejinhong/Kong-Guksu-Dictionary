package com.kong.kong_dic.domain.notification.websocket;

import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionSubscribeEvent;

@Slf4j
@Component
public class WebSocketEventListener {
    @EventListener
    public void handleSessionSubscribeEvent(SessionSubscribeEvent event) {
        log.info("🔔 구독 감지됨: {}", event.getMessage());
    }

    @EventListener
    public void handleSessionConnected(SessionConnectedEvent event) {
        log.info("🔗 WebSocket 연결 감지됨");
    }
}
