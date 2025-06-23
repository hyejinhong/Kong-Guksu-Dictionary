package com.kong.kong_dic.domain.user.service;

import com.kong.kong_dic.domain.restaurant.entity.Restaurant;
import com.kong.kong_dic.domain.restaurant.exception.RestaurantExceptionType;
import com.kong.kong_dic.domain.restaurant.repository.RestaurantRepository;
import com.kong.kong_dic.domain.restaurant.service.RestaurantService;
import com.kong.kong_dic.domain.user.dto.UserRestaurantVisitRequestDto;
import com.kong.kong_dic.domain.user.dto.UserRestaurantVisitResponseDto;
import com.kong.kong_dic.domain.user.entity.User;
import com.kong.kong_dic.domain.user.entity.UserRestaurantVisit;
import com.kong.kong_dic.domain.user.exception.UserExceptionType;
import com.kong.kong_dic.domain.user.repository.UserRestaurantVisitRepository;
import com.kong.kong_dic.global.exception.BaseException;
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

    public List<UserRestaurantVisitResponseDto> getVisitedRestaurants(User user, Pageable pageable) {
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

    public void insertVisitedRestaurant(User user, UserRestaurantVisitRequestDto request) {
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
    }

    public void deleteVisitedRestaurant(User user, Long id) {
        visitRepository.deleteByIdAndUserId(id, user.getId());
    }

    @Transactional
    public void updateVisitedRestaurant(User user, UserRestaurantVisitRequestDto request, Long id) {
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
