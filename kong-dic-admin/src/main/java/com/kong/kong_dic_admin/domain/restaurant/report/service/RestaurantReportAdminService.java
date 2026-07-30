package com.kong.kong_dic_admin.domain.restaurant.report.service;

import com.kong.kong_dic.common.domain.restaurant.dto.RestaurantReportReplyRequestDto;
import com.kong.kong_dic.common.domain.restaurant.dto.RestaurantReportResponseDto;
import com.kong.kong_dic.common.domain.restaurant.entity.RestaurantReport;
import com.kong.kong_dic.common.domain.restaurant.model.ReportStatus;
import com.kong.kong_dic.common.dto.NotificationMessage;
import com.kong.kong_dic_admin.domain.restaurant.notification.redis.RedisStreamPublisher;
import com.kong.kong_dic_admin.domain.restaurant.report.repository.RestaurantReportAdminRepository;
import com.kong.kong_dic_admin.domain.user.entity.User;
import com.kong.kong_dic_admin.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class RestaurantReportAdminService {

    private final RestaurantReportAdminRepository reportRepository;
    private final UserRepository userRepository;
    private final RedisStreamPublisher redisStreamPublisher;

    @Transactional(readOnly = true)
    public List<RestaurantReportResponseDto> getAllReports() {
        List<RestaurantReport> reports = reportRepository.findAllByOrderByIdDesc();

        return reports.stream().map(report -> {
            String userNickname = "익명";
            if (report.getUserId() != null) {
                userNickname = userRepository.findById(report.getUserId())
                        .map(User::getNickname)
                        .orElse("유저 #" + report.getUserId());
            }

            return RestaurantReportResponseDto.builder()
                    .id(report.getId())
                    .restaurantId(report.getRestaurantId())
                    .restaurantName("식당 #" + report.getRestaurantId())
                    .userId(report.getUserId())
                    .userNickname(userNickname)
                    .category(report.getCategory())
                    .categoryDescription(report.getCategory() != null ? report.getCategory().getDescription() : null)
                    .content(report.getContent())
                    .status(report.getStatus())
                    .reply(report.getReply())
                    .repliedAt(report.getRepliedAt())
                    .createdAt(report.getCreatedAt())
                    .build();
        }).collect(Collectors.toList());
    }

    @Transactional
    public void updateReportStatus(Long reportId, ReportStatus status) {
        RestaurantReport report = reportRepository.findById(reportId)
                .orElseThrow(() -> new IllegalArgumentException("제보 내역을 찾을 수 없습니다."));

        if (status == ReportStatus.RESOLVED) {
            report.resolve();
        } else if (status == ReportStatus.REJECTED) {
            report.reject();
        } else {
            report.setStatus(status);
        }
        reportRepository.save(report);
    }

    @Transactional
    public void replyToReport(Long reportId, RestaurantReportReplyRequestDto request) {
        RestaurantReport report = reportRepository.findById(reportId)
                .orElseThrow(() -> new IllegalArgumentException("제보 내역을 찾을 수 없습니다."));

        ReportStatus targetStatus = request.getStatus() != null ? request.getStatus() : ReportStatus.RESOLVED;
        report.updateReply(request.getReply(), targetStatus);
        reportRepository.save(report);

        // 로그인한 회원 제보인 경우 답변 알림 발송
        if (report.getUserId() != null) {
            userRepository.findById(report.getUserId()).ifPresent(user -> {
                String notificationContent = "🚩 요청하신 식당 정보 수정 제보에 답변이 등록되었습니다";
                if (request.getReply() != null && !request.getReply().trim().isEmpty()) {
                    notificationContent += ": \"" + request.getReply().trim() + "\"";
                }

                NotificationMessage notification = NotificationMessage.builder()
                        .username(user.getUsername())
                        .title("ReportReply")
                        .type("alert")
                        .content(notificationContent)
                        .build();

                redisStreamPublisher.publish(notification);
                log.info("### Published ReportReply Notification to User: {}", user.getUsername());
            });
        }
    }
}
