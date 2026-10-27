package com.kong.kong_dic.domain.follow.service;

import com.kong.kong_dic.common.exception.BaseException;
import com.kong.kong_dic.domain.follow.dto.FollowStatusResponseDto;
import com.kong.kong_dic.domain.follow.dto.FollowUserResponseDto;
import com.kong.kong_dic.domain.follow.entity.Follow;
import com.kong.kong_dic.domain.follow.repository.FollowRepository;
import com.kong.kong_dic.domain.notification.service.NotificationService;
import com.kong.kong_dic.domain.user.entity.Role;
import com.kong.kong_dic.domain.user.entity.SeasoningPreference;
import com.kong.kong_dic.domain.user.entity.User;
import com.kong.kong_dic.domain.user.exception.UserExceptionType;
import com.kong.kong_dic.domain.user.repository.UserRepository;
import com.kong.kong_dic.domain.user.repository.UserRestaurantVisitRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class FollowServiceTest {

    @Mock
    private FollowRepository followRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private UserRestaurantVisitRepository visitRepository;

    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private FollowService followService;

    private User followerUser;
    private User targetUser;
    private static final String FOLLOWER_PUBLIC_ID = "11111111-1111-1111-1111-111111111111";
    private static final String TARGET_PUBLIC_ID = "22222222-2222-2222-2222-222222222222";

    @BeforeEach
    void setUp() {
        followerUser = User.builder()
                .id(1L)
                .publicId(FOLLOWER_PUBLIC_ID)
                .username("followerUser")
                .nickname("콩국수러버")
                .role(Role.USER)
                .seasoningPreference(SeasoningPreference.SALT)
                .build();

        targetUser = User.builder()
                .id(2L)
                .publicId(TARGET_PUBLIC_ID)
                .username("targetUser")
                .nickname("소금파장인")
                .role(Role.USER)
                .seasoningPreference(SeasoningPreference.SUGAR)
                .build();
    }

    @Test
    @DisplayName("성공: 미팔로우 상태에서 토글 시 팔로우 생성 및 알림 발송")
    void toggleFollow_shouldCreateFollowAndSendNotification_whenNotFollowing() {
        // Given
        when(userRepository.findByUsername("followerUser")).thenReturn(Optional.of(followerUser));
        when(userRepository.findByPublicId(TARGET_PUBLIC_ID)).thenReturn(Optional.of(targetUser));
        when(followRepository.findByFollowerIdAndFollowingId(1L, 2L)).thenReturn(Optional.empty());
        when(followRepository.countByFollowingId(2L)).thenReturn(5L);
        when(followRepository.countByFollowerId(2L)).thenReturn(3L);

        // When
        FollowStatusResponseDto result = followService.toggleFollow("followerUser", TARGET_PUBLIC_ID);

        // Then
        assertThat(result.getIsFollowing()).isTrue();
        assertThat(result.getFollowerCount()).isEqualTo(5L);
        assertThat(result.getFollowingCount()).isEqualTo(3L);
        verify(followRepository, times(1)).save(any(Follow.class));
        verify(notificationService, times(1)).sendNotification(
                eq(targetUser),
                eq("새로운 팔로워"),
                eq("콩국수러버님이 회원님을 팔로우하기 시작했습니다."),
                eq("팔로우")
        );
    }

    @Test
    @DisplayName("성공: 이미 팔로우 중인 상태에서 토글 시 언팔로우 처리 및 알림 미발송")
    void toggleFollow_shouldDeleteFollow_whenAlreadyFollowing() {
        // Given
        Follow existingFollow = Follow.builder()
                .id(10L)
                .follower(followerUser)
                .following(targetUser)
                .build();

        when(userRepository.findByUsername("followerUser")).thenReturn(Optional.of(followerUser));
        when(userRepository.findByPublicId(TARGET_PUBLIC_ID)).thenReturn(Optional.of(targetUser));
        when(followRepository.findByFollowerIdAndFollowingId(1L, 2L)).thenReturn(Optional.of(existingFollow));
        when(followRepository.countByFollowingId(2L)).thenReturn(4L);
        when(followRepository.countByFollowerId(2L)).thenReturn(3L);

        // When
        FollowStatusResponseDto result = followService.toggleFollow("followerUser", TARGET_PUBLIC_ID);

        // Then
        assertThat(result.getIsFollowing()).isFalse();
        assertThat(result.getFollowerCount()).isEqualTo(4L);
        verify(followRepository, times(1)).delete(existingFollow);
        verify(notificationService, never()).sendNotification(any(), any(), any(), any());
    }

    @Test
    @DisplayName("실패: 자기 자신을 팔로우하려 할 때 CANNOT_FOLLOW_SELF 예외 발생")
    void toggleFollow_shouldThrowException_whenFollowingSelf() {
        // Given
        when(userRepository.findByUsername("followerUser")).thenReturn(Optional.of(followerUser));
        when(userRepository.findByPublicId(FOLLOWER_PUBLIC_ID)).thenReturn(Optional.of(followerUser));

        // When & Then
        BaseException ex = assertThrows(BaseException.class, () ->
                followService.toggleFollow("followerUser", FOLLOWER_PUBLIC_ID)
        );
        assertThat(ex.getExceptionType()).isEqualTo(UserExceptionType.CANNOT_FOLLOW_SELF);
        verify(followRepository, never()).save(any());
    }

    @Test
    @DisplayName("성공: 팔로우 상태 및 팔로워/팔로잉 수 조회")
    void getFollowStatus_shouldReturnStatusAndCounts() {
        // Given
        when(userRepository.findByPublicId(TARGET_PUBLIC_ID)).thenReturn(Optional.of(targetUser));
        when(userRepository.findByUsername("followerUser")).thenReturn(Optional.of(followerUser));
        when(followRepository.existsByFollowerIdAndFollowingId(1L, 2L)).thenReturn(true);
        when(followRepository.countByFollowingId(2L)).thenReturn(10L);
        when(followRepository.countByFollowerId(2L)).thenReturn(7L);

        // When
        FollowStatusResponseDto result = followService.getFollowStatus("followerUser", TARGET_PUBLIC_ID);

        // Then
        assertThat(result.getIsFollowing()).isTrue();
        assertThat(result.getFollowerCount()).isEqualTo(10L);
        assertThat(result.getFollowingCount()).isEqualTo(7L);
    }

    @Test
    @DisplayName("성공: 팔로워 목록 페이징 조회")
    void getFollowers_shouldReturnPagedFollowers() {
        // Given
        Pageable pageable = PageRequest.of(0, 20);
        Follow follow = Follow.builder()
                .id(100L)
                .follower(followerUser)
                .following(targetUser)
                .createdAt(LocalDateTime.now())
                .build();
        Page<Follow> followPage = new PageImpl<>(List.of(follow), pageable, 1);

        when(userRepository.findByPublicId(TARGET_PUBLIC_ID)).thenReturn(Optional.of(targetUser));
        when(followRepository.findFollowersByUserId(2L, pageable)).thenReturn(followPage);
        when(visitRepository.countVisitsByUserIds(List.of(1L))).thenReturn(List.<Object[]>of(new Object[]{1L, 12L}));
        when(userRepository.findByUsername("targetUser")).thenReturn(Optional.of(targetUser));
        when(followRepository.findFollowingIdsByFollowerIdAndTargetIds(2L, List.of(1L))).thenReturn(List.of(1L));

        // When
        Page<FollowUserResponseDto> result = followService.getFollowers(TARGET_PUBLIC_ID, "targetUser", pageable);

        // Then
        assertThat(result.getContent()).hasSize(1);
        FollowUserResponseDto item = result.getContent().get(0);
        assertThat(item.getUserId()).isEqualTo(FOLLOWER_PUBLIC_ID);
        assertThat(item.getNickname()).isEqualTo("콩국수러버");
        assertThat(item.getVisitedCount()).isEqualTo(12L);
        assertThat(item.getIsFollowing()).isTrue();
    }

    @Test
    @DisplayName("성공: 'me' 키워드로 내 팔로잉 목록 페이징 조회")
    void getFollowings_withMeKeyword_shouldReturnMyFollowings() {
        // Given
        Pageable pageable = PageRequest.of(0, 20);
        Follow follow = Follow.builder()
                .id(101L)
                .follower(followerUser)
                .following(targetUser)
                .createdAt(LocalDateTime.now())
                .build();
        Page<Follow> followPage = new PageImpl<>(List.of(follow), pageable, 1);

        when(userRepository.findByUsername("followerUser")).thenReturn(Optional.of(followerUser));
        when(followRepository.findFollowingsByUserId(1L, pageable)).thenReturn(followPage);
        when(visitRepository.countVisitsByUserIds(List.of(2L))).thenReturn(List.<Object[]>of(new Object[]{2L, 8L}));
        when(followRepository.findFollowingIdsByFollowerIdAndTargetIds(1L, List.of(2L))).thenReturn(List.of(2L));

        // When
        Page<FollowUserResponseDto> result = followService.getFollowings("me", "followerUser", pageable);

        // Then
        assertThat(result.getContent()).hasSize(1);
        FollowUserResponseDto item = result.getContent().get(0);
        assertThat(item.getUserId()).isEqualTo(TARGET_PUBLIC_ID);
        assertThat(item.getNickname()).isEqualTo("소금파장인");
        assertThat(item.getVisitedCount()).isEqualTo(8L);
        assertThat(item.getIsFollowing()).isTrue();
    }
}
