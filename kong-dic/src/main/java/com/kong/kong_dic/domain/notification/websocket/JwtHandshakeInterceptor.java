package com.kong.kong_dic.domain.notification.websocket;

import com.kong.kong_dic.global.jwt.JwtProvider;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;

import java.util.List;
import java.util.Map;

@Slf4j
@Component
public class JwtHandshakeInterceptor implements HandshakeInterceptor {

    private final JwtProvider jwtTokenProvider;

    public JwtHandshakeInterceptor(JwtProvider jwtTokenProvider) {
        this.jwtTokenProvider = jwtTokenProvider;
    }

    @Override
    public boolean beforeHandshake(ServerHttpRequest request,
                                   ServerHttpResponse response,
                                   WebSocketHandler wsHandler,
                                   Map<String, Object> attributes) {

        List<String> authHeaders = request.getHeaders().get("Authorization");
        if (authHeaders != null && !authHeaders.isEmpty()) {
            String bearerToken = authHeaders.get(0);
            if (bearerToken.startsWith("Bearer ")) {
                String token = bearerToken.substring(7);
                if (jwtTokenProvider.validateToken(token)) {
                    var authentication = jwtTokenProvider.getAuthentication(token);
                    log.info("### authentication : {}", authentication);
                    attributes.put("principal", authentication.getPrincipal());  // Principal만 넣어줌
                }
            }
        }

        // 항상 true 반환하여 연결 허용
        return true;
    }

    @Override
    public void afterHandshake(ServerHttpRequest request,
                               ServerHttpResponse response,
                               WebSocketHandler wsHandler,
                               Exception exception) {
        // no-op
    }
}
