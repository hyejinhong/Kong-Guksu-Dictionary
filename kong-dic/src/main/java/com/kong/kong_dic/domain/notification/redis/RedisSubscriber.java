package com.kong.kong_dic.domain.notification.redis;

import com.google.gson.Gson;
import org.springframework.data.redis.connection.Message;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

@Component
public class RedisSubscriber {

    private final SimpMessagingTemplate messagingTemplate;

    public RedisSubscriber(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    public void onMessage(Message message, byte[] pattern) {
        String msgBody = new String(message.getBody());
        NotificationMessage notification = new Gson().fromJson(msgBody, NotificationMessage.class);

        // WebSocket을 통해 해당 유저에게 전송
        messagingTemplate.convertAndSend("/topic/notifications/" + notification.getUserId(), notification);
    }
}