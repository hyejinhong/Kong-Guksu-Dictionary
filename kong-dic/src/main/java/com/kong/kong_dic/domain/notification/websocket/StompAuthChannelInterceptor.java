package com.kong.kong_dic.domain.notification.websocket;

import com.kong.kong_dic.global.jwt.JwtProvider;
import com.kong.kong_dic.global.security.SecurityAuditLogger;
import lombok.RequiredArgsConstructor;
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
                SecurityAuditLogger.logWarn("STOMP_CONNECT_REJECTED", null, "N/A", "STOMP CONNECT", "Unauthenticated WebSocket connection attempt");
                throw new MessageDeliveryException("Unauthorized WebSocket connection.");
            }
        } else if (StompCommand.SUBSCRIBE.equals(command)) {
            Principal user = accessor.getUser();
            String destination = accessor.getDestination();
            if (user == null || user.getName() == null || user.getName().isBlank()) {
                SecurityAuditLogger.logWarn("STOMP_SUBSCRIBE_REJECTED", null, "N/A", "STOMP SUBSCRIBE " + destination, "Unauthenticated subscription attempt");
                throw new MessageDeliveryException("Unauthorized WebSocket subscription.");
            }

            String expectedDestination = NOTIFICATION_TOPIC_PREFIX + user.getName();
            if (destination == null || !expectedDestination.equalsIgnoreCase(destination)) {
                SecurityAuditLogger.logWarn("STOMP_SUBSCRIBE_REJECTED", user.getName(), "N/A", "STOMP SUBSCRIBE " + destination, "Forbidden subscription destination");
                throw new MessageDeliveryException("Forbidden subscription destination.");
            }
        } else if (StompCommand.SEND.equals(command)) {
            Principal user = accessor.getUser();
            String username = (user != null) ? user.getName() : null;
            String destination = accessor.getDestination();
            SecurityAuditLogger.logWarn("STOMP_SEND_REJECTED", username, "N/A", "STOMP SEND " + destination, "Client message publishing blocked");
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
                SecurityAuditLogger.logWarn("STOMP_TOKEN_INVALID", null, "N/A", "STOMP CONNECT", e.getMessage());
            }
        }
    }
}
