package com.kong.kong_dic.domain.notification.controller;

import com.kong.kong_dic.common.response.BaseResponse;
import com.kong.kong_dic.common.dto.NotificationMessage;
import com.kong.kong_dic.domain.notification.service.NotificationService;
import com.kong.kong_dic.domain.user.entity.User;
import com.kong.kong_dic.global.annotation.AuthUser;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping("/notifications")
    public ResponseEntity<BaseResponse<List<NotificationMessage>>> getAllNotifications(@AuthUser UserDetails userDetails) {
        List<NotificationMessage> notifications = notificationService.getAllNotifications(userDetails.getUsername());
        return ResponseEntity.ok(BaseResponse.success(notifications));
    }
}
