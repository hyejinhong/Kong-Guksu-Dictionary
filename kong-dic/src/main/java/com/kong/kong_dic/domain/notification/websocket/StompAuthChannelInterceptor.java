package com.kong.kong_dic.domain.notification.websocket;

import com.kong.kong_dic.global.jwt.JwtProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.MessageDeliveryException;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import java.security.Principal;

@Slf4j
@Component
@RequiredArgsConstructor
public class StompAuthChannelInterceptor implements ChannelInterceptor {

    private static final String NOTIFICATION_TOPIC_PREFIX = "/topic/notifications/";

    private final JwtProvider jwtProvider;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor == null || accessor.getCommand() == null) {
            return message;
        }

        StompCommand command = accessor.getCommand();

        if (StompCommand.CONNECT.equals(command)) {
            authenticateIfNeeded(accessor);
            Principal user = accessor.getUser();
            if (user == null || user.getName() == null || user.getName().isBlank()) {
                log.warn("⚠️ STOMP CONNECT 거부: 인증되지 않은 사용자");
                throw new MessageDeliveryException("Unauthorized WebSocket connection.");
            }
        } else if (StompCommand.SUBSCRIBE.equals(command)) {
            Principal user = accessor.getUser();
            if (user == null || user.getName() == null || user.getName().isBlank()) {
                log.warn("⚠️ STOMP SUBSCRIBE 거부: 인증되지 않은 사용자");
                throw new MessageDeliveryException("Unauthorized WebSocket subscription.");
            }

            String destination = accessor.getDestination();
            String expectedDestination = NOTIFICATION_TOPIC_PREFIX + user.getName();
            if (destination == null || !expectedDestination.equalsIgnoreCase(destination)) {
                log.warn("⚠️ STOMP SUBSCRIBE 거부: 사용자 [{}]가 허용되지 않은 경로 [{}] 구독 시도", user.getName(), destination);
                throw new MessageDeliveryException("Forbidden subscription destination.");
            }
        } else if (StompCommand.SEND.equals(command)) {
            String destination = accessor.getDestination();
            log.warn("⚠️ STOMP SEND 거부: 클라이언트 메시지 발행 차단 (Destination: {})", destination);
            throw new MessageDeliveryException("Client message publishing is not allowed.");
        }

        return message;
    }

    private void authenticateIfNeeded(StompHeaderAccessor accessor) {
        Principal currentUser = accessor.getUser();
        if (currentUser instanceof Authentication auth
                && auth.getPrincipal() instanceof UserDetails userDetails) {
            if (!userDetails.isEnabled()) {
                accessor.setUser(null);
            }
            return;
        }

        String bearerToken = accessor.getFirstNativeHeader("Authorization");
        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            String token = bearerToken.substring(7);
            try {
                if (jwtProvider.validateToken(token) && jwtProvider.isAccessToken(token)) {
                    Authentication authentication = jwtProvider.getAuthentication(token);
                    if (authentication.getPrincipal() instanceof UserDetails userDetails && userDetails.isEnabled()) {
                        accessor.setUser(authentication);
                    }
                }
            } catch (Exception e) {
                log.warn("⚠️ STOMP CONNECT 토큰 검증 실패: {}", e.getMessage());
            }
        }
    }
}
