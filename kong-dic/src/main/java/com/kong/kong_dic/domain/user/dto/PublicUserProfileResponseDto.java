package com.kong.kong_dic.domain.user.dto;

import com.kong.kong_dic.domain.user.entity.SeasoningPreference;
import com.kong.kong_dic.domain.user.entity.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PublicUserProfileResponseDto {
    private String userId;
    private String nickname;
    private String avatarVariant;
    private String avatarSeed;
    private String profileImageUrl;
    private SeasoningPreference seasoningPreference;
    private long visitedCount;
    private long followerCount;
    private long followingCount;
    private Boolean isFollowing;
    private Boolean isMe;

    public static PublicUserProfileResponseDto of(
            User user,
            long visitedCount,
            long followerCount,
            long followingCount,
            boolean isFollowing,
            boolean isMe) {
        return PublicUserProfileResponseDto.builder()
                .userId(user.getPublicId())
                .nickname(user.getNickname() != null ? user.getNickname() : user.getUsername())
                .avatarVariant(user.getAvatarVariant() != null ? user.getAvatarVariant() : "beam")
                .avatarSeed(user.getAvatarSeed() != null ? user.getAvatarSeed() : "default")
                .profileImageUrl(user.getProfileImageUrl())
                .seasoningPreference(user.getSeasoningPreference() != null ? user.getSeasoningPreference() : SeasoningPreference.NONE)
                .visitedCount(visitedCount)
                .followerCount(followerCount)
                .followingCount(followingCount)
                .isFollowing(isFollowing)
                .isMe(isMe)
                .build();
    }
}
