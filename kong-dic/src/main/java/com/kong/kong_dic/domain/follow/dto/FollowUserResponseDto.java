package com.kong.kong_dic.domain.follow.dto;

import com.kong.kong_dic.domain.user.entity.SeasoningPreference;
import com.kong.kong_dic.domain.user.entity.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FollowUserResponseDto {
    private String userId;
    private String nickname;
    private String avatarVariant;
    private String avatarSeed;
    private String profileImageUrl;
    private SeasoningPreference seasoningPreference;
    private long visitedCount;
    private Boolean isFollowing;
    private LocalDateTime followedAt;

    public static FollowUserResponseDto of(User user, long visitedCount, boolean isFollowing, LocalDateTime followedAt) {
        return FollowUserResponseDto.builder()
                .userId(user.getPublicId())
                .nickname(user.getNickname() != null ? user.getNickname() : user.getUsername())
                .avatarVariant(user.getAvatarVariant() != null ? user.getAvatarVariant() : "beam")
                .avatarSeed(user.getAvatarSeed() != null ? user.getAvatarSeed() : "default")
                .profileImageUrl(user.getProfileImageUrl())
                .seasoningPreference(user.getSeasoningPreference() != null ? user.getSeasoningPreference() : SeasoningPreference.NONE)
                .visitedCount(visitedCount)
                .isFollowing(isFollowing)
                .followedAt(followedAt)
                .build();
    }
}
