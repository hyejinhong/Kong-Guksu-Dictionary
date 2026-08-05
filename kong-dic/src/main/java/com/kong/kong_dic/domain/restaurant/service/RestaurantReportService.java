package com.kong.kong_dic.domain.restaurant.service;

import com.kong.kong_dic.common.domain.restaurant.dto.RestaurantReportRequestDto;
import com.kong.kong_dic.common.domain.restaurant.dto.RestaurantReportResponseDto;
import com.kong.kong_dic.domain.restaurant.entity.Restaurant;
import com.kong.kong_dic.common.domain.restaurant.entity.RestaurantReport;
import com.kong.kong_dic.domain.restaurant.repository.RestaurantRepository;
import com.kong.kong_dic.domain.restaurant.repository.RestaurantReportRepository;
import com.kong.kong_dic.domain.user.entity.User;
import com.kong.kong_dic.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class RestaurantReportService {

    private final RestaurantReportRepository reportRepository;
    private final RestaurantRepository restaurantRepository;
    private final UserRepository userRepository;

    @Transactional
    public void createReport(Long restaurantId, String username, RestaurantReportRequestDto request) {
        restaurantRepository.findById(restaurantId)
                .orElseThrow(() -> new IllegalArgumentException("식당을 찾을 수 없습니다."));

        Long userId = null;
        if (username != null && !username.trim().isEmpty()) {
            User user = userRepository.findByUsername(username)
                    .orElse(null);
            if (user != null) {
                userId = user.getId();
            }
        }

        RestaurantReport report = RestaurantReport.builder()
                .restaurantId(restaurantId)
                .userId(userId)
                .category(request.getCategory())
                .content(request.getContent())
                .build();

        reportRepository.save(report);
        log.info("### Restaurant Report Created - RestaurantId: {}, UserId: {}, Category: {}", restaurantId, userId, request.getCategory());
    }

    @Transactional(readOnly = true)
    public List<RestaurantReportResponseDto> getReportsByRestaurant(Long restaurantId) {
        Restaurant restaurant = restaurantRepository.findById(restaurantId)
                .orElseThrow(() -> new IllegalArgumentException("식당을 찾을 수 없습니다."));

        return reportRepository.findByRestaurantIdOrderByIdDesc(restaurantId).stream()
                .map(report -> toDto(report, restaurant.getName()))
                .collect(Collectors.toList());
    }

    private RestaurantReportResponseDto toDto(RestaurantReport report, String restaurantName) {
        String userNickname = null;
        if (report.getUserId() != null) {
            userNickname = userRepository.findById(report.getUserId())
                    .map(User::getNickname)
                    .orElse(null);
        }

        return RestaurantReportResponseDto.builder()
                .id(report.getId())
                .restaurantId(report.getRestaurantId())
                .restaurantName(restaurantName)
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
    }
}
