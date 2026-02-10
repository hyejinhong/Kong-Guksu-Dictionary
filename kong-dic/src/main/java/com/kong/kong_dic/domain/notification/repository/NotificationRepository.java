package com.kong.kong_dic.domain.notification.repository;

import com.kong.kong_dic.domain.notification.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findAllByReceiverIdOrderByCreatedAtDesc(Long receiverId);
}