package com.kong.kong_dic.domain.notification.websocket;

import com.kong.kong_dic.global.jwt.JwtProvider;
import com.kong.kong_dic.global.security.SecurityAuditLogger;
import lombok.RequiredArgsConstructor;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.support.DefaultHandshakeHandler;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.security.Principal;
import java.util.Map;

@RequiredArgsConstructor
public class CustomHandshakeHandler extends DefaultHandshakeHandler {

    private final JwtProvider jwtTokenProvider;

    @Override
    protected Principal determineUser(ServerHttpRequest request,
                                      WebSocketHandler wsHandler,
                                      Map<String, Object> attributes) {

        URI uri = request.getURI();
        String path = uri != null ? uri.getPath() : "/ws";
        String clientIp = request.getRemoteAddress() != null ? request.getRemoteAddress().toString() : "N/A";
        String token = UriComponentsBuilder.fromUri(uri)
                .build()
                .getQueryParams()
                .getFirst("token");

        if (token != null && !token.isBlank()) {
            try {
                if (jwtTokenProvider.validateToken(token) && jwtTokenProvider.isAccessToken(token)) {
                    Authentication authentication = jwtTokenProvider.getAuthentication(token);
                    Object principal = authentication.getPrincipal();
                    if (principal instanceof UserDetails userDetails && !userDetails.isEnabled()) {
                        SecurityAuditLogger.logWarn("WS_HANDSHAKE_REJECTED", userDetails.getUsername(), clientIp, path, "Disabled account attempted WebSocket handshake");
                        return null;
                    }
                    attributes.put("principal", principal);
                    return authentication;
                }
            } catch (Exception e) {
                SecurityAuditLogger.logWarn("WS_HANDSHAKE_REJECTED", null, clientIp, path, "Invalid token: " + e.getMessage());
            }
        }

        SecurityAuditLogger.logWarn("WS_HANDSHAKE_REJECTED", null, clientIp, path, "Missing or invalid WebSocket token");
        return null;
    }
}
