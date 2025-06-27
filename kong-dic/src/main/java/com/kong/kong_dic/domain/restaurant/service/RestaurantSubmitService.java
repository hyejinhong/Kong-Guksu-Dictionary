package com.kong.kong_dic.domain.restaurant.service;

import com.google.gson.Gson;
import com.kong.kong_dic.domain.notification.dto.NotificationMessage;
import com.kong.kong_dic.domain.notification.redis.RedisStreamPublisher;
import com.kong.kong_dic.domain.restaurant.dto.RestaurantSubmitRequestDto;
import com.kong.kong_dic.domain.restaurant.entity.Restaurant;
import com.kong.kong_dic.domain.restaurant.entity.RestaurantSubmission;
import com.kong.kong_dic.domain.restaurant.repository.RestaurantRepository;
import com.kong.kong_dic.domain.restaurant.repository.RestaurantSubmitRepository;
import com.kong.kong_dic.domain.user.entity.User;
import com.kong.kong_dic.global.util.KakaoMapUtil;
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
public class RestaurantSubmitService {

    private final RestaurantSubmitRepository submitRepository;
    private final RestaurantRepository restaurantRepository;
    private final KakaoMapUtil kakaoMapUtil;

    private final StringRedisTemplate redisTemplate;
    private final Gson gson = new Gson();
    private final RedisStreamPublisher redisStreamPublisher;

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

    public void addRestaurantSubmission(User user, RestaurantSubmitRequestDto request) {
        // TODO 로그인 안 한 경우 제한
        log.info("### Restaurant Submission Requested : {}", request.toString());
        RestaurantSubmission submission = RestaurantSubmission.builder()
                .name(request.getName())
                .address(request.getAddress())
                .beanTypes(request.getBeanTypes())
                .servesAllYear(request.getServesAllYear())
                .startMonth(request.getStartMonth())
                .endMonth(request.getEndMonth())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .user(user)
                .build();
        submitRepository.save(submission);
    }

    public void approveSubmission(Long id) {
        RestaurantSubmission submission = submitRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Submission not found"));
        submission.approved();
        submitRepository.save(submission);

        // Search Coordinates via KakaoMap
        // Coordinates coordinate = kakaoMapUtil.addressToCoordinates(submission.getAddress());

        Restaurant restaurant = Restaurant.builder()
                .name(submission.getName())
                .address(submission.getAddress())
                .latitude(submission.getLatitude())
                .longitude(submission.getLongitude())
                .beanTypes(submission.getBeanTypes())
                .startMonth(submission.getStartMonth())
                .endMonth(submission.getEndMonth())
                .build();

        log.debug("### inserted Entity : {}", restaurant.toString());

        // 알림 메시지 생성
        NotificationMessage notification = NotificationMessage.builder()
                .username(submission.getUser().getUsername())
                .title("Approve")
                .type("alert")
                .content("❤️ 요청하신 " + submission.getName() + " 등록이 승인되었습니다.")
                .build();

        // Redis Stream 발행
        redisStreamPublisher.publish(notification);
        restaurantRepository.save(restaurant);
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
                .beanTypes(submission.getBeanTypes())
                .servesAllYear(submission.getServesAllYear())
                .startMonth(submission.getStartMonth())
                .endMonth(submission.getEndMonth())
                .status(submission.getStatus())
                .userId(submission.getUser() == null ? null : submission.getUser().getId())
                .build();
    }

}
