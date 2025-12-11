package com.kong.kong_dic.domain.restaurant.service;

import com.kong.kong_dic.common.exception.BaseException;
import com.kong.kong_dic.domain.restaurant.entity.Restaurant;
import com.kong.kong_dic.domain.restaurant.repository.RestaurantRepository;
import com.kong.kong_dic.domain.restaurant.dto.RatingStatsDto;
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

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class RestaurantServiceTest {

    @Mock
    private RestaurantRepository restaurantRepository;

    @Mock
    private UserRestaurantVisitRepository visitRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private RestaurantService restaurantService;

    @Test
    @DisplayName("성공: 처음 방문/저장시 새로운 기록 생성")
    void addOrUpdateVisit_shouldCreateNewVisit_whenNoVisitExists() {
        // Given
        Long userId = 1L;
        Long restaurantId = 100L;
        Double rating = 5.0;

        User user = User.builder().id(userId).build();
        Restaurant restaurant = Restaurant.builder().id(restaurantId).build();

        // 1. 사용자 및 식당 조회 성공
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(restaurantRepository.findById(restaurantId)).thenReturn(Optional.of(restaurant));

        // 2. 기존 방문 기록 없음
        when(visitRepository.findByUserIdAndRestaurantId(userId, restaurantId)).thenReturn(Optional.empty());

        // 3. 통계 쿼리 결과
        RatingStatsDto statsDto = new RatingStatsDto(1L, 5.0);
        when(visitRepository.findStatsByRestaurantId(restaurantId)).thenReturn(statsDto);

        // when
        restaurantService.addOrUpdateVisit(userId, restaurantId, rating);

        // Then
        // 1. 새로운 방문기록 저장되었는지?
        verify(visitRepository, times(1)).save(any(UserRestaurantVisit.class));

        // 2. 식당 엔티티 통계가 업데이트 되었는지?
        assertThat(restaurant.getTotalScraps()).isEqualTo(1L);
        assertThat(restaurant.getAverageRating()).isEqualTo(5.0);
    }

    @Test
    @DisplayName("성공: 이미 방문한 경우 별점만 수정, 통계 업데이트")
    void addOrUpdateVisit_shouldUpdateExistingVisit_whenVisitExists() {
        // Given
        Long userId = 1L;
        Long restaurantId = 100L;
        Double oldRating = 3.0;
        Double newRating = 5.0;

        User user = User.builder().id(userId).build();
        Restaurant restaurant = Restaurant.builder().id(restaurantId).build();

        // 기존 방문 기록
        UserRestaurantVisit existingVisit = UserRestaurantVisit.builder()
                .user(user)
                .restaurant(restaurant)
                .rating(oldRating)
                .build();

        // Mocking
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(restaurantRepository.findById(restaurantId)).thenReturn(Optional.of(restaurant));
        when(visitRepository.findByUserIdAndRestaurantId(userId, restaurantId))
                .thenReturn(Optional.of(existingVisit));
        RatingStatsDto statsDto = new RatingStatsDto(1L, 5.0); // 수정 후
        when(visitRepository.findStatsByRestaurantId(restaurantId)).thenReturn(statsDto);

        // when
        restaurantService.addOrUpdateVisit(userId, restaurantId, newRating);

        // Then
        // 1. 새롭게 저장되지 않았는지?
        verify(visitRepository, never()).save(any(UserRestaurantVisit.class));
        // 2. 평점이 수정되었는지?
        assertThat(existingVisit.getRating()).isEqualTo(newRating);
        // 3. 통계 필드 업데이트 되었는지?
        assertThat(restaurant.getTotalScraps()).isEqualTo(1L);
        assertThat(restaurant.getAverageRating()).isEqualTo(5.0);
    }

    @Test
    @DisplayName("실패: 존재하지 않는 사용자가 요청할 경우 예외 발생")
    void addOrUpdateVisit_shouldThrowException_whenUserNotFound() {
        // Given
        Long userId = 999L;
        Long restaurantId = 1L;
        Double rating = 5.0;

        // Mocking
        when(userRepository.findById(userId)).thenReturn(Optional.empty());

        // when & then
        assertThrows(BaseException.class, () -> {
            restaurantService.addOrUpdateVisit(userId, restaurantId, rating);
        });

        // Verify : 저장, 조회 로직 실행 안되었는지?
        verify(restaurantRepository, never()).findById(anyLong());
        verify(visitRepository, never()).save(any(UserRestaurantVisit.class));
    }

    @Test
    @DisplayName("실패: 존재하지 않는 식당에 대해 요청하는 경우 예외 발생")
    void addOrUpdateVisit_shouldThrowException_whenRestaurantNotFound() {
        // Given
        Long userId = 1L;
        Long restaurantId = 999L;
        Double rating = 5.0;

        User user = User.builder().id(userId).build();

        // Mocking
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(restaurantRepository.findById(restaurantId)).thenReturn(Optional.empty());

        // When & Then
        assertThrows(BaseException.class, () -> {
            restaurantService.addOrUpdateVisit(userId, restaurantId, rating);
        });

        // Verify
        verify(visitRepository, never()).save(any(UserRestaurantVisit.class));
    }
}
