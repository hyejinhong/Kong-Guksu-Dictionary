package com.kong.kong_dic_admin.domain.restaurant.submission.service;

import com.google.gson.Gson;
import com.kong.kong_dic.common.domain.restaurant.dto.RestaurantSubmitRequestDto;
import com.kong.kong_dic.common.domain.restaurant.entity.RestaurantSubmission;
import com.kong.kong_dic.common.dto.NotificationMessage;
import com.kong.kong_dic.common.event.RestaurantApprovedEvent;
import com.kong.kong_dic.common.model.BeanPrice;
import com.kong.kong_dic_admin.domain.restaurant.notification.redis.RedisStreamPublisher;
import com.kong.kong_dic_admin.domain.restaurant.submission.repository.RestaurantSubmitAdminRepository;
import com.kong.kong_dic_admin.domain.user.entity.User;
import com.kong.kong_dic_admin.domain.user.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class RestaurantSubmitAdminService {
    private final RedisStreamPublisher redisStreamPublisher;
    private final StringRedisTemplate redisTemplate;
    private final Gson gson = new Gson();
    private final RestaurantSubmitAdminRepository submitRepository;
    private final UserRepository userRepository;

    public List<RestaurantSubmitRequestDto> getAllSubmissions() {
        return submitRepository.findAll().stream()
                .map(this::entityToRequestDto)
                .toList();
    }

    public RestaurantSubmitRequestDto getSubmission(Long id) {
        RestaurantSubmission submission = submitRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Request not found: " + id));
        return entityToRequestDto(submission);
    }

    public void approveSubmission(Long id, RestaurantSubmitRequestDto updateDto) {
        RestaurantSubmission submission = submitRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Submission not found"));

        if (updateDto != null) {
            if (updateDto.getName() != null) {
                submission.setName(updateDto.getName());
            }
            if (updateDto.getAddress() != null) {
                submission.setAddress(updateDto.getAddress());
            }
            if (updateDto.getServesAllYear() != null) {
                submission.setServesAllYear(updateDto.getServesAllYear());
            }
            submission.setStartMonth(updateDto.getStartMonth());
            submission.setEndMonth(updateDto.getEndMonth());
            if (updateDto.getPrices() != null) {
                submission.setPrices(updateDto.getPrices());
            }
            if (updateDto.getLatitude() != null) {
                submission.setLatitude(updateDto.getLatitude());
            }
            if (updateDto.getLongitude() != null) {
                submission.setLongitude(updateDto.getLongitude());
            }
        }

        submission.approved();
        submitRepository.save(submission);

        // Search Coordinates via KakaoMap
        // Coordinates coordinate = kakaoMapUtil.addressToCoordinates(submission.getAddress());

        // JPA shared child - Deep Copy
        List<BeanPrice> newPrices = submission.getPrices().stream()
                .map(p -> BeanPrice.builder()
                        .beanType(p.getBeanType())
                        .price(p.getPrice())
                        .build())
                .toList();

        RestaurantApprovedEvent event = RestaurantApprovedEvent.builder()
                .submissionId(submission.getId())
                .name(submission.getName())
                .address(submission.getAddress())
                .latitude(submission.getLatitude())
                .longitude(submission.getLongitude())
                .servesAllYear(submission.getServesAllYear())
                .startMonth(submission.getStartMonth())
                .endMonth(submission.getEndMonth())
                .prices(submission.getPrices())
                .userId(submission.getUserId())
                .build();

        String payload = gson.toJson(event);
        redisTemplate.opsForStream().add("restaurant.approved", Map.of("data", payload));

        log.info("### Published RestaurantApprovedEvent: {}", payload);

        // 로그인한 유저가 요청한 경우에만 알림 발행
        if (submission.getUserId() != null) {
            User user = userRepository.findById(submission.getUserId()).orElseThrow();

            // 알림 메시지 생성
            NotificationMessage notification = NotificationMessage.builder()
                    .username(user.getUsername())
                    .title("Approve")
                    .type("alert")
                    .content("❤️ 요청하신 " + submission.getName() + " 등록이 승인되었습니다.")
                    .build();

            // Redis Stream 발행
            redisStreamPublisher.publish(notification);
        }
    }

    public void rejectSubmission(Long id, String rejectReason) {
        RestaurantSubmission submission = submitRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Submission not found"));
        submission.reject(rejectReason);
        submitRepository.save(submission);

        // 로그인한 유저가 요청한 경우에만 알림 발행
        if (submission.getUserId() != null) {
            User user = userRepository.findById(submission.getUserId()).orElseThrow();

            // 거절 사유 포맷팅
            String notificationContent = "💔 요청하신 " + submission.getName() + " 식당 등록이 거절되었습니다.";
            if (rejectReason != null && !rejectReason.trim().isEmpty()) {
                notificationContent += " (사유: " + rejectReason + ")";
            }

            // 알림 메시지 생성
            NotificationMessage notification = NotificationMessage.builder()
                    .username(user.getUsername())
                    .title("Reject")
                    .type("alert")
                    .content(notificationContent)
                    .build();

            // Redis Stream 발행
            redisStreamPublisher.publish(notification);
        }
    }

    private RestaurantSubmitRequestDto entityToRequestDto(RestaurantSubmission submission) {
        String submitterName = null;
        String submitterNickname = null;

        log.info("### Processing Submission ID: {}, userId: {}", submission.getId(), submission.getUserId());

        if (submission.getUserId() != null) {
            User user = userRepository.findById(submission.getUserId()).orElse(null);
            if (user != null) {
                submitterName = user.getUsername();
                submitterNickname = user.getNickname();
                log.info("### Found Submitter: {} ({})", submitterNickname, submitterName);
            } else {
                log.warn("### User not found for ID: {}", submission.getUserId());
            }
        }

        return RestaurantSubmitRequestDto.builder()
                .id(submission.getId())
                .name(submission.getName())
                .address(submission.getAddress())
                .prices(submission.getPrices())
                .servesAllYear(submission.getServesAllYear())
                .startMonth(submission.getStartMonth())
                .endMonth(submission.getEndMonth())
                .status(submission.getStatus())
                .userId(submission.getUserId())
                .restaurantId(submission.getRestaurantId())
                .submitterName(submitterName)
                .submitterNickname(submitterNickname)
                .rejectReason(submission.getRejectReason())
                .build();
    }
}
