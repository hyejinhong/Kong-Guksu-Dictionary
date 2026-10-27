package com.kong.kong_dic.domain.notification.service;

import com.kong.kong_dic.common.dto.NotificationMessage;
import com.kong.kong_dic.common.exception.BaseException;
import com.kong.kong_dic.domain.notification.entity.Notification;
import com.kong.kong_dic.domain.notification.repository.NotificationRepository;
import com.kong.kong_dic.domain.user.entity.User;
import com.kong.kong_dic.domain.user.exception.UserExceptionType;
import com.kong.kong_dic.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    /**
     * 알림 생성 및 실시간 WebSocket 발송
     */
    @Transactional
    public void sendNotification(User receiver, String title, String content, String type) {
        if (receiver == null) return;

        Notification dbNotification = Notification.builder()
                .receiverId(receiver.getId())
                .title(title)
                .content(content)
                .type(type)
                .isRead(false)
                .createdAt(LocalDateTime.now())
                .build();
        notificationRepository.save(dbNotification);

        try {
            NotificationMessage notification = NotificationMessage.builder()
                    .username(receiver.getUsername())
                    .title(title)
                    .content(content)
                    .type(type)
                    .build();
            messagingTemplate.convertAndSend("/topic/notifications/" + receiver.getUsername(), notification);
        } catch (Exception e) {
            log.warn("실시간 알림 WebSocket 전송 실패 (DB 저장은 완료됨): {}", e.getMessage());
        }
    }

    /**
     * 사용자의 모든 알림 내역 조회 (DB)
     */
    @Transactional(readOnly = true)
    public List<NotificationMessage> getAllNotifications(String username) {
        User user = userRepository.findByUsername(username).orElseThrow(() -> new BaseException(UserExceptionType.USER_NOT_FOUND));

        // 1. DB에서 해당 유저의 알림을 최신순으로 조회
        List<Notification> notifications = notificationRepository.findAllByReceiverIdOrderByCreatedAtDesc(user.getId());

        // 2. Entity -> DTO 변환
        return notifications.stream()
                .map(entity -> NotificationMessage.builder()
                        .username(username)
                        .title(entity.getTitle())
                        .content(entity.getContent())
                        .type(entity.getType())
                        .build())
                .collect(Collectors.toList());
    }
}