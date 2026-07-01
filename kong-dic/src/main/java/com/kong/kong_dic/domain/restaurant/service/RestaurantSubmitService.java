package com.kong.kong_dic.domain.restaurant.service;

import com.kong.kong_dic.common.domain.restaurant.dto.RestaurantSubmitRequestDto;
import com.kong.kong_dic.common.domain.restaurant.entity.RestaurantSubmission;
import com.kong.kong_dic.common.domain.restaurant.model.SubmissionStatus;
import com.kong.kong_dic.common.exception.BaseException;
import com.kong.kong_dic.common.util.KakaoMapUtil;
import com.kong.kong_dic.domain.restaurant.repository.RestaurantRepository;
import com.kong.kong_dic.domain.restaurant.repository.RestaurantSubmitRepository;
import com.kong.kong_dic.domain.user.entity.User;
import com.kong.kong_dic.domain.user.exception.UserExceptionType;
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
public class RestaurantSubmitService {

    private final RestaurantSubmitRepository submitRepository;
    private final RestaurantRepository restaurantRepository;
    private final KakaoMapUtil kakaoMapUtil;
    private final UserRepository userRepository;

    @Transactional
    public List<RestaurantSubmitRequestDto> getMySubmissions(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new BaseException(UserExceptionType.USER_NOT_FOUND));
        
        List<RestaurantSubmission> submissions = submitRepository.findByUserIdOrderByIdDesc(user.getId());

        // Self-healing for missing restaurantId on approved submissions
        for (RestaurantSubmission sub : submissions) {
            if (sub.getStatus() == SubmissionStatus.APPROVED && sub.getRestaurantId() == null) {
                log.info("### Self-healing: Found approved submission with missing restaurantId. Name: {}", sub.getName());
                restaurantRepository.findByNameAndAddress(sub.getName(), sub.getAddress())
                        .ifPresent(r -> {
                            sub.setRestaurantId(r.getId());
                            submitRepository.save(sub);
                            log.info("### Self-healing: Successfully linked submission {} to restaurant {}", sub.getId(), r.getId());
                        });
            }
        }

        return submissions.stream()
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
                .restaurantId(submission.getRestaurantId())
                .rejectReason(submission.getRejectReason())
                .build();
    }

}
