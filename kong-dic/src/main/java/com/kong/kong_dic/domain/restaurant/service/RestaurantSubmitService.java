package com.kong.kong_dic.domain.restaurant.service;

import com.kong.kong_dic.common.domain.restaurant.dto.RestaurantSubmitRequestDto;
import com.kong.kong_dic.common.domain.restaurant.entity.RestaurantSubmission;
import com.kong.kong_dic.common.exception.BaseException;
import com.kong.kong_dic.common.util.KakaoMapUtil;
import com.kong.kong_dic.domain.restaurant.repository.RestaurantSubmitRepository;
import com.kong.kong_dic.domain.user.entity.User;
import com.kong.kong_dic.domain.user.exception.UserExceptionType;
import com.kong.kong_dic.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class RestaurantSubmitService {

    private final RestaurantSubmitRepository submitRepository;
    private final KakaoMapUtil kakaoMapUtil;
    private final UserRepository userRepository;

    public List<RestaurantSubmitRequestDto> getMySubmissions(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new BaseException(UserExceptionType.USER_NOT_FOUND));
        
        return submitRepository.findByUserIdOrderByIdDesc(user.getId())
                .stream()
                .map(this::entityToRequestDto)
                .collect(Collectors.toList());
    }

    public void addRestaurantSubmission(String username, RestaurantSubmitRequestDto request) {
        Long userId = null;

        if (username != null && !username.trim().isEmpty())  {
            User user = userRepository.findByUsername(username).orElseThrow(() -> new BaseException(UserExceptionType.USER_NOT_FOUND));
            userId = user.getId();
            log.info("### Submitting as User: {} (ID: {})", username, userId);
        } else {
            log.info("### Submitting as Anonymous");
        }

        log.info("### Restaurant Submission Requested : {}", request.toString());
        RestaurantSubmission submission = RestaurantSubmission.builder()
                .name(request.getName())
                .address(request.getAddress())
                .prices(request.getPrices())
                .servesAllYear(request.getServesAllYear())
                .startMonth(request.getStartMonth())
                .endMonth(request.getEndMonth())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .userId(userId)
                .build();
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
