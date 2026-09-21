package com.kong.kong_dic.domain.user.service;

import com.kong.kong_dic.common.exception.BaseException;
import com.kong.kong_dic.domain.image.service.ImageUploadService;
import com.kong.kong_dic.domain.restaurant.dto.RatingStatsDto;
import com.kong.kong_dic.domain.restaurant.entity.Restaurant;
import com.kong.kong_dic.domain.restaurant.repository.RestaurantRepository;
import com.kong.kong_dic.domain.user.dto.UserRestaurantVisitRequestDto;
import com.kong.kong_dic.domain.user.entity.User;
import com.kong.kong_dic.domain.user.entity.UserRestaurantVisit;
import com.kong.kong_dic.domain.user.repository.UserRepository;
import com.kong.kong_dic.domain.user.repository.UserRestaurantVisitRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserRestaurantVisitServiceTest {

    @Mock
    private UserRestaurantVisitRepository visitRepository;

    @Mock
    private RestaurantRepository restaurantRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ImageUploadService imageUploadService;

    @InjectMocks
    private UserRestaurantVisitService visitService;

    @Test
    @DisplayName("리뷰 삭제 성공 - 방문 기록 삭제, 별점 통계 갱신, R2 이미지 삭제 호출 확인")
    void deleteVisitedRestaurant_success() {
        // given
        String username = "testUser";
        Long visitId = 1L;
        Long restaurantId = 10L;
        String imageUrl = "https://pub-test.r2.dev/reviews/test.jpg";

        User user = User.builder().id(100L).username(username).build();
        Restaurant restaurant = Restaurant.builder().id(restaurantId).name("맛있는 콩국수").build();
        UserRestaurantVisit visit = UserRestaurantVisit.builder()
                .id(visitId)
                .user(user)
                .restaurant(restaurant)
                .imageUrl(imageUrl)
                .rating(5.0)
                .build();

        when(userRepository.findByUsername(username)).thenReturn(Optional.of(user));
        when(visitRepository.findById(visitId)).thenReturn(Optional.of(visit));
        when(visitRepository.findStatsByRestaurantId(restaurantId)).thenReturn(new RatingStatsDto(0L, 0.0));

        // when
        visitService.deleteVisitedRestaurant(username, visitId);

        // then
        verify(visitRepository, times(1)).delete(visit);
        verify(visitRepository, times(1)).flush();
        verify(visitRepository, times(1)).findStatsByRestaurantId(restaurantId);
        verify(restaurantRepository, times(1)).save(restaurant);
        verify(imageUploadService, times(1)).deleteImage(imageUrl);
    }

    @Test
    @DisplayName("리뷰 수정 성공 - 사진 교체 시 기존 R2 이미지 삭제 호출 및 별점 변경 시 통계 갱신")
    void updateVisitedRestaurant_replaceImageAndChangeRating_success() {
        // given
        String username = "testUser";
        Long visitId = 1L;
        Long restaurantId = 10L;
        String oldImageUrl = "https://pub-test.r2.dev/reviews/old.jpg";
        String newImageUrl = "https://pub-test.r2.dev/reviews/new.jpg";

        User user = User.builder().id(100L).username(username).build();
        Restaurant restaurant = Restaurant.builder().id(restaurantId).build();
        UserRestaurantVisit visit = UserRestaurantVisit.builder()
                .id(visitId)
                .user(user)
                .restaurant(restaurant)
                .imageUrl(oldImageUrl)
                .rating(3.0)
                .build();

        UserRestaurantVisitRequestDto request = UserRestaurantVisitRequestDto.builder()
                .restaurantId(restaurantId)
                .visitDate(LocalDate.now())
                .rating(5.0)
                .memo("새로운 메모")
                .imageUrl(newImageUrl)
                .build();

        when(userRepository.findByUsername(username)).thenReturn(Optional.of(user));
        when(visitRepository.findById(visitId)).thenReturn(Optional.of(visit));
        when(visitRepository.findStatsByRestaurantId(restaurantId)).thenReturn(new RatingStatsDto(1L, 5.0));

        // when
        visitService.updateVisitedRestaurant(username, request, visitId);

        // then
        assertThat(visit.getImageUrl()).isEqualTo(newImageUrl);
        assertThat(visit.getRating()).isEqualTo(5.0);
        assertThat(visit.getMemo()).isEqualTo("새로운 메모");

        verify(visitRepository, times(1)).save(visit);
        verify(visitRepository, times(1)).findStatsByRestaurantId(restaurantId);
        verify(restaurantRepository, times(1)).save(restaurant);
        verify(imageUploadService, times(1)).deleteImage(oldImageUrl);
    }

    @Test
    @DisplayName("리뷰 수정 실패 - 타인의 리뷰를 수정하려는 경우 FORBIDDEN 예외")
    void updateVisitedRestaurant_forbidden() {
        // given
        String username = "testUser";
        Long visitId = 1L;

        User owner = User.builder().id(100L).username("owner").build();
        User anotherUser = User.builder().id(200L).username(username).build();
        UserRestaurantVisit visit = UserRestaurantVisit.builder()
                .id(visitId)
                .user(owner)
                .build();

        UserRestaurantVisitRequestDto request = UserRestaurantVisitRequestDto.builder()
                .rating(4.0)
                .build();

        when(userRepository.findByUsername(username)).thenReturn(Optional.of(anotherUser));
        when(visitRepository.findById(visitId)).thenReturn(Optional.of(visit));

        // when & then
        assertThrows(BaseException.class, () -> visitService.updateVisitedRestaurant(username, request, visitId));
        verify(imageUploadService, never()).deleteImage(anyString());
    }
}
