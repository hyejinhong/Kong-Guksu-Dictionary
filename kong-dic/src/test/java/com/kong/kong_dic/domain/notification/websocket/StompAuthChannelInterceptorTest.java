package com.kong.kong_dic.domain.notification.websocket;

import com.kong.kong_dic.domain.user.entity.Role;
import com.kong.kong_dic.domain.user.entity.User;
import com.kong.kong_dic.global.jwt.JwtProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.MessageDeliveryException;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@ExtendWith(MockitoExtension.class)
class StompAuthChannelInterceptorTest {

    @Mock
    private JwtProvider jwtProvider;
    @Mock
    private MessageChannel messageChannel;

    private StompAuthChannelInterceptor interceptor;

    @BeforeEach
    void setUp() {
        interceptor = new StompAuthChannelInterceptor(jwtProvider);
    }

    @Test
    @DisplayName("본인의 알림 토픽(/topic/notifications/{username}) 구독은 정상 허용한다")
    void preSend_AllowsOwnNotificationSubscription() {
        User user = User.builder()
                .username("userA")
                .role(Role.USER)
                .enabled(true)
                .build();
        UsernamePasswordAuthenticationToken auth =
                new UsernamePasswordAuthenticationToken(user, "", List.of(Role.USER));

        StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.SUBSCRIBE);
        accessor.setUser(auth);
        accessor.setDestination("/topic/notifications/userA");
        accessor.setLeaveMutable(true);
        Message<byte[]> message = MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());

        Message<?> result = interceptor.preSend(message, messageChannel);
        assertThat(result).isNotNull();
    }

    @Test
    @DisplayName("타 유저의 알림 토픽(/topic/notifications/{otherUser}) 구독 시 예외를 발생시켜 차단한다")
    void preSend_BlocksOtherUserNotificationSubscription() {
        User user = User.builder()
                .username("userA")
                .role(Role.USER)
                .enabled(true)
                .build();
        UsernamePasswordAuthenticationToken auth =
                new UsernamePasswordAuthenticationToken(user, "", List.of(Role.USER));

        StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.SUBSCRIBE);
        accessor.setUser(auth);
        accessor.setDestination("/topic/notifications/userB");
        accessor.setLeaveMutable(true);
        Message<byte[]> message = MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());

        assertThatThrownBy(() -> interceptor.preSend(message, messageChannel))
                .isInstanceOf(MessageDeliveryException.class)
                .hasMessageContaining("Forbidden subscription destination");
    }

    @Test
    @DisplayName("클라이언트가 직접 STOMP SEND로 메시지를 발행하려 하면 차단한다")
    void preSend_BlocksClientMessageSend() {
        User user = User.builder()
                .username("userA")
                .role(Role.USER)
                .enabled(true)
                .build();
        UsernamePasswordAuthenticationToken auth =
                new UsernamePasswordAuthenticationToken(user, "", List.of(Role.USER));

        StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.SEND);
        accessor.setUser(auth);
        accessor.setDestination("/topic/notifications/userB");
        accessor.setLeaveMutable(true);
        Message<byte[]> message = MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());

        assertThatThrownBy(() -> interceptor.preSend(message, messageChannel))
                .isInstanceOf(MessageDeliveryException.class)
                .hasMessageContaining("Client message publishing is not allowed");
    }

    @Test
    @DisplayName("인증 정보가 없는 사용자의 STOMP CONNECT 요청은 차단한다")
    void preSend_BlocksUnauthenticatedConnect() {
        StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.CONNECT);
        accessor.setLeaveMutable(true);
        Message<byte[]> message = MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());

        assertThatThrownBy(() -> interceptor.preSend(message, messageChannel))
                .isInstanceOf(MessageDeliveryException.class)
                .hasMessageContaining("Unauthorized WebSocket connection");
    }
}
