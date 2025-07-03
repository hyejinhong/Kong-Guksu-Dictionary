package com.kong.kong_dic.domain.notification.websocket;

import com.kong.kong_dic.global.jwt.JwtProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.support.DefaultHandshakeHandler;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@Slf4j
@RequiredArgsConstructor
public class CustomHandshakeHandler extends DefaultHandshakeHandler {

    private final JwtProvider jwtTokenProvider;

    @Override
    protected Principal determineUser(ServerHttpRequest request,
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
                    return authentication;
                }
            }
        }

//        Object principalAttr = attributes.get("principal");
//
//        if (principalAttr instanceof Principal principal) {
//            log.info("✅ CustomHandshakeHandler: Principal 설정됨 → {}", principal.getName());
//            return principal;
//        }
        log.warn("⚠️ CustomHandshakeHandler: Principal 설정 실패 (attributes: {})", attributes);
        return null;
    }
}