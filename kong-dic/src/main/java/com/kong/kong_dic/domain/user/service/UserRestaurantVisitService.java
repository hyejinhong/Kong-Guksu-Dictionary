package com.kong.kong_dic.domain.user.service;

import com.kong.kong_dic.common.exception.BaseException;
import com.kong.kong_dic.domain.image.service.ImageUploadService;
import com.kong.kong_dic.domain.restaurant.dto.RestaurantRankingDto;
import com.kong.kong_dic.domain.restaurant.entity.Restaurant;
import com.kong.kong_dic.domain.restaurant.exception.RestaurantExceptionType;
import com.kong.kong_dic.domain.restaurant.repository.RestaurantRepository;
import com.kong.kong_dic.domain.restaurant.service.RestaurantService;
import com.kong.kong_dic.domain.user.dto.RecentReviewResponseDto;
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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;


import java.util.List;

@Service
@RequiredArgsConstructor
public class UserRestaurantVisitService {

    private final UserRestaurantVisitRepository visitRepository;
    private final RestaurantRepository restaurantRepository;
    private final UserRepository userRepository;
    private final ImageUploadService imageUploadService;

    @Transactional
    public Page<RecentReviewResponseDto> getRecentReviews(Pageable pageable) {
        Page<UserRestaurantVisit> visitPage = visitRepository.findRecentReviewsWithMemo(pageable);
        return visitPage.map(RecentReviewResponseDto::from);
    }

    @Transactional
    public List<RestaurantVisitNoteResponseDto> getRestaurantVisitNotes(Long restaurantId) {
        List<UserRestaurantVisit> visitList = visitRepository.findByRestaurantIdOrderByVisitDateDesc(restaurantId);
        return visitList.stream().map(visit -> {
            User u = visit.getUser();
            boolean isBlinded = Boolean.TRUE.equals(visit.getIsImageBlinded());
            return RestaurantVisitNoteResponseDto.builder()
                    .id(visit.getId())
                    .userId(u != null ? u.getId() : null)
                    .nickname(u != null && u.getNickname() != null ? u.getNickname() : (u != null ? u.getUsername() : "익명"))
                    .avatarVariant(u != null ? u.getAvatarVariant() : "beam")
                    .avatarSeed(u != null ? u.getAvatarSeed() : "default")
                    .seasoningPreference(u != null && u.getSeasoningPreference() != null ? u.getSeasoningPreference() : com.kong.kong_dic.domain.user.entity.SeasoningPreference.NONE)
                    .rating(visit.getRating())
                    .memo(visit.getMemo())
                    .imageUrl(isBlinded ? null : visit.getImageUrl())
                    .isImageBlinded(isBlinded)
                    .imageBlindReason(isBlinded && visit.getImageBlindReason() != null ? visit.getImageBlindReason().getDescription() : null)
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
        boolean isBlinded = Boolean.TRUE.equals(entity.getIsImageBlinded());
        return UserRestaurantVisitResponseDto.builder()
                .id(entity.getId())
                .restaurant(RestaurantService.entityToResponseDto(entity.getRestaurant()))
                .visitedDate(entity.getVisitDate())
                .rating(entity.getRating())
                .memo(entity.getMemo())
                .imageUrl(isBlinded ? null : entity.getImageUrl())
                .isImageBlinded(isBlinded)
                .imageBlindReason(isBlinded && entity.getImageBlindReason() != null ? entity.getImageBlindReason().getDescription() : null)
                .build();
    }

    @Transactional
    public void insertVisitedRestaurant(String username, UserRestaurantVisitRequestDto request) {
        User user = userRepository.findByUsername(username).orElseThrow(() -> new BaseException(UserExceptionType.USER_NOT_FOUND));

        Restaurant restaurant = restaurantRepository.findById(request.getRestaurantId())
                .orElseThrow(() -> new BaseException(RestaurantExceptionType.RESTAURANT_NOT_FOUND));

        visitRepository.findByUserIdAndRestaurantId(user.getId(), request.getRestaurantId())
                .ifPresent(visit -> {
                    throw new BaseException(UserExceptionType.ALREADY_VISITED_RESTAURANT);
                });
        String trimmedMemo = (request.getMemo() != null && !request.getMemo().trim().isEmpty())
                ? request.getMemo().trim()
                : null;

        UserRestaurantVisit entity = UserRestaurantVisit.builder()
                .user(user)
                .restaurant(restaurant)
                .visitDate(request.getVisitDate())
                .rating(request.getRating())
                .memo(trimmedMemo)
                .imageUrl(request.getImageUrl())
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

    @Transactional
    public void deleteVisitedRestaurant(String username, Long id) {
        User user = userRepository.findByUsername(username).orElseThrow(() -> new BaseException(UserExceptionType.USER_NOT_FOUND));

        UserRestaurantVisit visit = visitRepository.findById(id)
                .orElseThrow(() -> new BaseException(UserExceptionType.VISIT_NOT_FOUND));

        if (!visit.getUser().getId().equals(user.getId())) {
            throw new BaseException(UserExceptionType.FORBIDDEN);
        }

        String imageUrl = visit.getImageUrl();
        Restaurant restaurant = visit.getRestaurant();

        visitRepository.delete(visit);
        visitRepository.flush();

        // 평점 통계 갱신
        if (restaurant != null) {
            var stats = visitRepository.findStatsByRestaurantId(restaurant.getId());
            long count = stats != null ? stats.getCount() : 0L;
            double average = stats != null ? stats.getAverage() : 0.0;
            restaurant.updateStats(count, average);
            restaurantRepository.save(restaurant);
        }

        // Cloudflare R2 이미지 삭제
        if (imageUrl != null && !imageUrl.isBlank()) {
            imageUploadService.deleteImage(imageUrl);
        }
    }

    @Transactional
    public void updateVisitedRestaurant(String username, UserRestaurantVisitRequestDto request, Long id) {
        User user = userRepository.findByUsername(username).orElseThrow(() -> new BaseException(UserExceptionType.USER_NOT_FOUND));

        UserRestaurantVisit visit = visitRepository.findById(id)
                .orElseThrow(() -> new BaseException(UserExceptionType.VISIT_NOT_FOUND));

        if (!visit.getUser().getId().equals(user.getId())) {
            throw new BaseException(UserExceptionType.FORBIDDEN);
        }

        boolean ratingChanged = false;
        if (request.getRating() != null && !request.getRating().equals(visit.getRating())) {
            visit.setRating(request.getRating());
            ratingChanged = true;
        }
        if (request.getMemo() != null) {
            String trimmedMemo = !request.getMemo().trim().isEmpty() ? request.getMemo().trim() : null;
            visit.setMemo(trimmedMemo);
        }

        String oldImageUrl = visit.getImageUrl();
        boolean imageRemovedOrReplaced = false;

        if (request.getImageUrl() != null) {
            String trimmedUrl = !request.getImageUrl().trim().isEmpty() ? request.getImageUrl().trim() : null;
            if (trimmedUrl != null && !trimmedUrl.equals(oldImageUrl)) {
                visit.setImageUrl(trimmedUrl);
                visit.unblindImage();
                imageRemovedOrReplaced = true;
            } else if (trimmedUrl == null && oldImageUrl != null) {
                visit.setImageUrl(null);
                visit.unblindImage();
                imageRemovedOrReplaced = true;
            }
        }

        visitRepository.save(visit);

        // 별점이 변경되었으면 식당 통계 갱신
        if (ratingChanged && visit.getRestaurant() != null) {
            visitRepository.flush();
            var stats = visitRepository.findStatsByRestaurantId(visit.getRestaurant().getId());
            long count = stats != null ? stats.getCount() : 0L;
            double average = stats != null ? stats.getAverage() : 0.0;
            visit.getRestaurant().updateStats(count, average);
            restaurantRepository.save(visit.getRestaurant());
        }

        // 기존 이미지가 교체되었거나 삭제되었으면 이전 R2 이미지 삭제
        if (imageRemovedOrReplaced && oldImageUrl != null && !oldImageUrl.isBlank()) {
            imageUploadService.deleteImage(oldImageUrl);
        }
    }
}
