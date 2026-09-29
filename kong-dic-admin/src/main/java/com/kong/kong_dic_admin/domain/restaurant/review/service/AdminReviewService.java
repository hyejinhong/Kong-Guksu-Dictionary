package com.kong.kong_dic_admin.domain.restaurant.review.service;

import com.kong.kong_dic.common.dto.NotificationMessage;
import com.kong.kong_dic.common.model.BlindReason;
import com.kong.kong_dic_admin.domain.restaurant.notification.redis.RedisStreamPublisher;
import com.kong.kong_dic_admin.domain.restaurant.review.dto.AdminReviewImageBlindRequestDto;
import com.kong.kong_dic_admin.domain.restaurant.review.dto.AdminReviewImageResponseDto;
import com.kong.kong_dic_admin.domain.restaurant.review.entity.UserRestaurantVisit;
import com.kong.kong_dic_admin.domain.restaurant.review.repository.AdminReviewRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminReviewService {

    private final AdminReviewRepository reviewRepository;
    private final RedisStreamPublisher redisStreamPublisher;

    @Transactional(readOnly = true)
    public Page<AdminReviewImageResponseDto> getReviewImages(String filter, Pageable pageable) {
        Page<UserRestaurantVisit> page;
        if ("NORMAL".equalsIgnoreCase(filter)) {
            page = reviewRepository.findNormalWithImage(pageable);
        } else if ("BLINDED".equalsIgnoreCase(filter)) {
            page = reviewRepository.findBlindedWithImage(pageable);
        } else {
            page = reviewRepository.findAllWithImage(pageable);
        }

        return page.map(this::toResponseDto);
    }

    @Transactional
    public void setBlindStatus(Long visitId, AdminReviewImageBlindRequestDto request) {
        UserRestaurantVisit visit = reviewRepository.findById(visitId)
                .orElseThrow(() -> new IllegalArgumentException("해당 방문 리뷰를 찾을 수 없습니다. (ID: " + visitId + ")"));

        if (request.isBlind()) {
            BlindReason reason = request.getReason() != null ? request.getReason() : BlindReason.IRRELEVANT;
            visit.blindImage(reason);
            log.info("🚫 [Admin] 리뷰 이미지 블라인드 처리 완료. visitId={}, reason={}", visitId, reason);

            // 작성자에게 실시간 알림 발송
            if (visit.getUser() != null && visit.getUser().getUsername() != null) {
                String restaurantName = visit.getRestaurant() != null ? visit.getRestaurant().getName() : "식당";
                NotificationMessage notification = NotificationMessage.builder()
                        .username(visit.getUser().getUsername())
                        .title("ReviewImageBlind")
                        .type("alert")
                        .content("📸 [" + restaurantName + "] 리뷰 사진이 관리자에 의해 블라인드 처리되었습니다. (사유: " + reason.getDescription() + ")")
                        .build();

                redisStreamPublisher.publish(notification);
                log.info("🔔 [Admin] 블라인드 알림 전송 완료 to user: {}", visit.getUser().getUsername());
            }
        } else {
            visit.unblindImage();
            log.info("🔓 [Admin] 리뷰 이미지 블라인드 해제 완료. visitId={}", visitId);
        }

        reviewRepository.save(visit);
    }

    private AdminReviewImageResponseDto toResponseDto(UserRestaurantVisit visit) {
        String restaurantName = visit.getRestaurant() != null ? visit.getRestaurant().getName() : "";
        Long restaurantId = visit.getRestaurant() != null ? visit.getRestaurant().getId() : null;
        Long userId = visit.getUser() != null ? visit.getUser().getId() : null;
        String username = visit.getUser() != null ? visit.getUser().getUsername() : "";
        String userNickname = visit.getUser() != null && visit.getUser().getNickname() != null
                ? visit.getUser().getNickname() : username;

        return AdminReviewImageResponseDto.builder()
                .id(visit.getId())
                .restaurantId(restaurantId)
                .restaurantName(restaurantName)
                .userId(userId)
                .username(username)
                .userNickname(userNickname)
                .rating(visit.getRating())
                .memo(visit.getMemo())
                .imageUrl(visit.getImageUrl())
                .isImageBlinded(Boolean.TRUE.equals(visit.getIsImageBlinded()))
                .imageBlindReason(visit.getImageBlindReason())
                .imageBlindReasonDescription(visit.getImageBlindReason() != null ? visit.getImageBlindReason().getDescription() : null)
                .imageBlindedAt(visit.getImageBlindedAt())
                .visitDate(visit.getVisitDate())
                .build();
    }
}
