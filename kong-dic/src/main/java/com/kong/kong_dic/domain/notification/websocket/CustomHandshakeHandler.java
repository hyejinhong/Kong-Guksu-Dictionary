package com.kong.kong_dic.domain.notification.websocket;

import com.kong.kong_dic.global.jwt.JwtProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.support.DefaultHandshakeHandler;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.security.Principal;
import java.util.Map;

@Slf4j
@RequiredArgsConstructor
public class CustomHandshakeHandler extends DefaultHandshakeHandler {

    private final JwtProvider jwtTokenProvider;

    @Override
    protected Principal determineUser(ServerHttpRequest request,
                                      WebSocketHandler wsHandler,
                                      Map<String, Object> attributes) {

        URI uri = request.getURI();
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
                        log.warn("⚠️ CustomHandshakeHandler: 정지된 계정 WebSocket 연결 거부 [{}]", userDetails.getUsername());
                        return null;
                    }
                    attributes.put("principal", principal);
                    return authentication;
                }
            } catch (Exception e) {
                log.warn("⚠️ CustomHandshakeHandler: 유효하지 않은 토큰: {}", e.getMessage());
            }
        }

        log.warn("⚠️ CustomHandshakeHandler: Principal 설정 실패 (토큰을 찾을 수 없거나 유효하지 않습니다.)");
        return null;
    }
}
