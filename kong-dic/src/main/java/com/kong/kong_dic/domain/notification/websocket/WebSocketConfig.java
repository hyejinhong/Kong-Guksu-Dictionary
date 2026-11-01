package com.kong.kong_dic.domain.notification.websocket;

import com.kong.kong_dic.global.config.CorsProperties;
import com.kong.kong_dic.global.jwt.JwtProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

import java.util.List;

@Slf4j
@Configuration
@EnableWebSocketMessageBroker
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final JwtProvider jwtProvider;
    private final CorsProperties corsProperties;
    private final StompAuthChannelInterceptor stompAuthChannelInterceptor;

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.enableSimpleBroker("/topic");  // 1:1 메시지용
        registry.setApplicationDestinationPrefixes("/app");
        registry.setUserDestinationPrefix("/user"); // 사용자별 메시지 라우팅
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        List<String> allowedOrigins = corsProperties.getAllowedOrigins();
        String[] origins = allowedOrigins.isEmpty()
                ? new String[]{"http://localhost:3000"}
                : allowedOrigins.toArray(new String[0]);

        registry.addEndpoint("/ws")
                .setHandshakeHandler(new CustomHandshakeHandler(jwtProvider))
                .setAllowedOrigins(origins)
                .withSockJS(); // 프론트에서 연결
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(stompAuthChannelInterceptor);
    }

}
