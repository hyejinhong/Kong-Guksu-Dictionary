package com.kong.kong_dic.domain.follow.service;

import com.kong.kong_dic.common.exception.BaseException;
import com.kong.kong_dic.domain.follow.dto.FollowStatusResponseDto;
import com.kong.kong_dic.domain.follow.dto.FollowUserResponseDto;
import com.kong.kong_dic.domain.follow.entity.Follow;
import com.kong.kong_dic.domain.follow.repository.FollowRepository;
import com.kong.kong_dic.domain.notification.service.NotificationService;
import com.kong.kong_dic.domain.user.entity.User;
import com.kong.kong_dic.domain.user.exception.UserExceptionType;
import com.kong.kong_dic.domain.user.repository.UserRepository;
import com.kong.kong_dic.domain.user.repository.UserRestaurantVisitRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.function.Function;

@Service
@RequiredArgsConstructor
public class FollowService {

    private final FollowRepository followRepository;
    private final UserRepository userRepository;
    private final UserRestaurantVisitRepository visitRepository;
    private final NotificationService notificationService;

    @Transactional
    public FollowStatusResponseDto toggleFollow(String currentUsername, String targetPublicId) {
        User follower = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new BaseException(UserExceptionType.USER_NOT_FOUND));

        User following = userRepository.findByPublicId(targetPublicId)
                .orElseThrow(() -> new BaseException(UserExceptionType.USER_NOT_FOUND));

        if (follower.getId().equals(following.getId())) {
            throw new BaseException(UserExceptionType.CANNOT_FOLLOW_SELF);
        }

        Long targetUserId = following.getId();
        Optional<Follow> existingFollow = followRepository.findByFollowerIdAndFollowingId(follower.getId(), targetUserId);
        boolean isFollowing;

        if (existingFollow.isPresent()) {
            followRepository.delete(existingFollow.get());
            followRepository.flush();
            isFollowing = false;
        } else {
            Follow newFollow = Follow.builder()
                    .follower(follower)
                    .following(following)
                    .build();
            followRepository.save(newFollow);
            followRepository.flush();
            isFollowing = true;

            String followerName = (follower.getNickname() != null && !follower.getNickname().isBlank())
                    ? follower.getNickname()
                    : follower.getUsername();
            notificationService.sendNotification(
                    following,
                    "새로운 팔로워",
                    followerName + "님이 회원님을 팔로우하기 시작했습니다.",
                    "팔로우"
            );
        }

        long followerCount = followRepository.countByFollowingId(targetUserId);
        long followingCount = followRepository.countByFollowerId(targetUserId);

        return FollowStatusResponseDto.builder()
                .isFollowing(isFollowing)
                .followerCount(followerCount)
                .followingCount(followingCount)
                .build();
    }

    @Transactional(readOnly = true)
    public FollowStatusResponseDto getFollowStatus(String currentUsername, String targetPublicId) {
        User targetUser = userRepository.findByPublicId(targetPublicId)
                .orElseThrow(() -> new BaseException(UserExceptionType.USER_NOT_FOUND));
        Long targetUserId = targetUser.getId();

        boolean isFollowing = false;
        if (currentUsername != null && !currentUsername.isBlank()) {
            Optional<User> currentUserOpt = userRepository.findByUsername(currentUsername);
            if (currentUserOpt.isPresent()) {
                isFollowing = followRepository.existsByFollowerIdAndFollowingId(currentUserOpt.get().getId(), targetUserId);
            }
        }

        long followerCount = followRepository.countByFollowingId(targetUserId);
        long followingCount = followRepository.countByFollowerId(targetUserId);

        return FollowStatusResponseDto.builder()
                .isFollowing(isFollowing)
                .followerCount(followerCount)
                .followingCount(followingCount)
                .build();
    }

    @Transactional(readOnly = true)
    public Page<FollowUserResponseDto> getFollowers(String targetPublicId, String currentUsername, Pageable pageable) {
        User targetUser = userRepository.findByPublicId(targetPublicId)
                .orElseThrow(() -> new BaseException(UserExceptionType.USER_NOT_FOUND));

        Page<Follow> followPage = followRepository.findFollowersByUserId(targetUser.getId(), pageable);
        return mapFollowPage(followPage, Follow::getFollower, currentUsername);
    }

    @Transactional(readOnly = true)
    public Page<FollowUserResponseDto> getFollowings(String targetPublicId, String currentUsername, Pageable pageable) {
        User targetUser = userRepository.findByPublicId(targetPublicId)
                .orElseThrow(() -> new BaseException(UserExceptionType.USER_NOT_FOUND));

        Page<Follow> followPage = followRepository.findFollowingsByUserId(targetUser.getId(), pageable);
        return mapFollowPage(followPage, Follow::getFollowing, currentUsername);
    }

    private Page<FollowUserResponseDto> mapFollowPage(Page<Follow> followPage, Function<Follow, User> userExtractor, String currentUsername) {
        List<Long> targetUserIds = followPage.getContent().stream()
                .map(userExtractor)
                .filter(Objects::nonNull)
                .map(User::getId)
                .filter(Objects::nonNull)
                .toList();

        Map<Long, Long> visitCountMap = new HashMap<>();
        if (!targetUserIds.isEmpty()) {
            List<Object[]> counts = visitRepository.countVisitsByUserIds(targetUserIds);
            if (counts != null) {
                for (Object[] row : counts) {
                    visitCountMap.put((Long) row[0], (Long) row[1]);
                }
            }
        }

        Set<Long> viewerFollowingIds = new HashSet<>();
        if (currentUsername != null && !currentUsername.isBlank() && !targetUserIds.isEmpty()) {
            userRepository.findByUsername(currentUsername).ifPresent(viewer -> {
                List<Long> followingIds = followRepository.findFollowingIdsByFollowerIdAndTargetIds(viewer.getId(), targetUserIds);
                if (followingIds != null) {
                    viewerFollowingIds.addAll(followingIds);
                }
            });
        }

        return followPage.map(follow -> {
            User targetUser = userExtractor.apply(follow);
            long visitedCount = visitCountMap.getOrDefault(targetUser.getId(), 0L);
            boolean isFollowing = viewerFollowingIds.contains(targetUser.getId());
            return FollowUserResponseDto.of(targetUser, visitedCount, isFollowing, follow.getCreatedAt());
        });
    }
}
