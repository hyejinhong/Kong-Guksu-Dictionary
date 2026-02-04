package com.kong.kong_dic.domain.notification.service;

import com.kong.kong_dic.common.dto.NotificationMessage;
import com.kong.kong_dic.common.exception.BaseException;
import com.kong.kong_dic.domain.notification.entity.Notification;
import com.kong.kong_dic.domain.notification.repository.NotificationRepository;
import com.kong.kong_dic.domain.user.entity.User;
import com.kong.kong_dic.domain.user.exception.UserExceptionType;
import com.kong.kong_dic.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

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