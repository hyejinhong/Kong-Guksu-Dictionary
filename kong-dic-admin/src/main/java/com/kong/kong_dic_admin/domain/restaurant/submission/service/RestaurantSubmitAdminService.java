package com.kong.kong_dic_admin.domain.restaurant.submission.service;

import com.google.gson.Gson;
import com.kong.kong_dic.common.domain.restaurant.dto.RestaurantSubmitRequestDto;
import com.kong.kong_dic.common.domain.restaurant.entity.RestaurantSubmission;
import com.kong.kong_dic.common.dto.NotificationMessage;
import com.kong.kong_dic.common.event.RestaurantApprovedEvent;
import com.kong.kong_dic.common.model.BeanPrice;
import com.kong.kong_dic_admin.domain.restaurant.notification.redis.RedisStreamPublisher;
import com.kong.kong_dic_admin.domain.restaurant.submission.repository.RestaurantSubmitAdminRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class RestaurantSubmitAdminService {
    private final RedisStreamPublisher redisStreamPublisher;
    private final StringRedisTemplate redisTemplate;
    private final Gson gson = new Gson();
    private final RestaurantSubmitAdminRepository submitRepository;

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

    public void approveSubmission(Long id) {
        RestaurantSubmission submission = submitRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Submission not found"));
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
                .collect(Collectors.toList());

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
        // 알림 메시지 생성
        NotificationMessage notification = NotificationMessage.builder()
                .username(submission.getUserId().getUsername())
                .title("Approve")
                .type("alert")
                .content("❤️ 요청하신 " + submission.getName() + " 등록이 승인되었습니다.")
                .build();

        // Redis Stream 발행
        redisStreamPublisher.publish(notification);
    }

    public void rejectSubmission(Long id) {
        RestaurantSubmission submission = submitRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Submission not found"));
        submission.reject();

        // 알림 메시지 생성
        NotificationMessage notification = NotificationMessage.builder()
                .username(submission.getUser().getUsername())
                .title("Reject")
                .type("alert")
                .content("💔 요청하신 " + submission.getName() + "식당 등록이 거절되었습니다.")
                .build();

        // Redis Stream 발행
        redisStreamPublisher.publish(notification);

        submitRepository.save(submission);
    }

    private RestaurantSubmitRequestDto entityToRequestDto(RestaurantSubmission submission) {
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
                .build();
    }


}
