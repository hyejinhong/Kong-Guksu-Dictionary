package com.kong.kong_dic.domain.user.service;

import com.kong.kong_dic.common.exception.BaseException;
import com.kong.kong_dic.domain.restaurant.dto.RestaurantRankingDto;
import com.kong.kong_dic.domain.restaurant.entity.Restaurant;
import com.kong.kong_dic.domain.restaurant.exception.RestaurantExceptionType;
import com.kong.kong_dic.domain.restaurant.repository.RestaurantRepository;
import com.kong.kong_dic.domain.restaurant.service.RestaurantService;
import com.kong.kong_dic.domain.user.dto.RestaurantVisitNoteResponseDto;
import com.kong.kong_dic.domain.user.dto.UserRestaurantVisitRequestDto;
import com.kong.kong_dic.domain.user.dto.UserRestaurantVisitResponseDto;
import com.kong.kong_dic.domain.user.entity.User;
import com.kong.kong_dic.domain.user.entity.UserRestaurantVisit;
import com.kong.kong_dic.domain.user.exception.UserExceptionType;
import com.kong.kong_dic.domain.user.repository.UserRepository;
import com.kong.kong_dic.domain.user.repository.UserRestaurantVisitRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserRestaurantVisitService {

    private final UserRestaurantVisitRepository visitRepository;
    private final RestaurantRepository restaurantRepository;
    private final UserRepository userRepository;

    @Transactional
    public List<RestaurantVisitNoteResponseDto> getRestaurantVisitNotes(Long restaurantId) {
        List<UserRestaurantVisit> visitList = visitRepository.findByRestaurantIdOrderByVisitDateDesc(restaurantId);
        return visitList.stream().map(visit -> {
            User u = visit.getUser();
            return RestaurantVisitNoteResponseDto.builder()
                    .id(visit.getId())
                    .userId(u != null ? u.getId() : null)
                    .nickname(u != null && u.getNickname() != null ? u.getNickname() : (u != null ? u.getUsername() : "익명"))
                    .avatarVariant(u != null ? u.getAvatarVariant() : "beam")
                    .avatarSeed(u != null ? u.getAvatarSeed() : "default")
                    .rating(visit.getRating())
                    .memo(visit.getMemo())
                    .visitDate(visit.getVisitDate())
                    .build();
        }).toList();
    }

    public List<UserRestaurantVisitResponseDto> getVisitedRestaurants(String username, Pageable pageable) {
        User user = userRepository.findByUsername(username).orElseThrow(() -> new BaseException(UserExceptionType.USER_NOT_FOUND));

        List<UserRestaurantVisit> entityList = visitRepository.findByUserId(user.getId(), pageable);
        return entityList.stream().map(this::entityToResponseDto).toList();
    }

    private UserRestaurantVisitResponseDto entityToResponseDto(UserRestaurantVisit entity) {
        return UserRestaurantVisitResponseDto.builder()
                .id(entity.getId())
                .restaurant(RestaurantService.entityToResponseDto(entity.getRestaurant()))
                .visitedDate(entity.getVisitDate())
                .rating(entity.getRating())
                .memo(entity.getMemo())
                .build();
    }

    public void insertVisitedRestaurant(String username, UserRestaurantVisitRequestDto request) {
        User user = userRepository.findByUsername(username).orElseThrow(() -> new BaseException(UserExceptionType.USER_NOT_FOUND));

        Restaurant restaurant = restaurantRepository.findById(request.getRestaurantId())
                .orElseThrow(() -> new BaseException(RestaurantExceptionType.RESTAURANT_NOT_FOUND));

        visitRepository.findByUserIdAndRestaurantId(user.getId(), request.getRestaurantId())
                .ifPresent(visit -> {
                    throw new BaseException(UserExceptionType.ALREADY_VISITED_RESTAURANT);
                });
        UserRestaurantVisit entity = UserRestaurantVisit.builder()
                .user(user)
                .restaurant(restaurant)
                .visitDate(request.getVisitDate())
                .rating(request.getRating())
                .memo(request.getMemo())
                .build();
        visitRepository.save(entity);

        // 별점 통계 업데이트
        visitRepository.flush();
        var stats = visitRepository.findStatsByRestaurantId(restaurant.getId());
        long count = stats != null ? stats.getCount() : 0L;
        double average = stats != null ? stats.getAverage() : 0.0;
        restaurant.updateStats(count, average);
        restaurantRepository.save(restaurant);
    }

    public void deleteVisitedRestaurant(String username, Long id) {
        User user = userRepository.findByUsername(username).orElseThrow(() -> new BaseException(UserExceptionType.USER_NOT_FOUND));
        visitRepository.deleteByIdAndUserId(id, user.getId());
    }

    @Transactional
    public void updateVisitedRestaurant(String username, UserRestaurantVisitRequestDto request, Long id) {
        User user = userRepository.findByUsername(username).orElseThrow(() -> new BaseException(UserExceptionType.USER_NOT_FOUND));

        UserRestaurantVisit visit = visitRepository.findById(id)
                .orElseThrow(() -> new BaseException(UserExceptionType.VISIT_NOT_FOUND));

        if (!visit.getUser().getId().equals(user.getId())) {
            throw new BaseException(UserExceptionType.FORBIDDEN);
        }

        if (request.getRating() != null)
            visit.setRating(request.getRating());
        if (request.getMemo() != null)
            visit.setMemo(request.getMemo());
    }
}
