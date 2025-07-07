package com.kong.kong_dic.domain.notification.websocket;

import com.kong.kong_dic.global.jwt.JwtProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.support.DefaultHandshakeHandler;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
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

        // 1. 요청 URI에서 토큰 쿼리 파라미터 추출
        URI uri = request.getURI();
        String token = UriComponentsBuilder.fromUri(uri)
                .build()
                .getQueryParams()
                .getFirst("token"); // "token"이라는 이름의 쿼리 파라미터

        if (token != null && jwtTokenProvider.validateToken(token)) {
            var authentication = jwtTokenProvider.getAuthentication(token);
            log.info("### authentication : {}", authentication);
            attributes.put("principal", authentication.getPrincipal());
            return authentication;
        }

        log.warn("⚠️ CustomHandshakeHandler: Principal 설정 실패 (토큰을 찾을 수 없거나 유효하지 않습니다.)");
        return null;    }
}