package com.kong.kong_dic.domain.user.dto;

import com.kong.kong_dic.domain.user.entity.SeasoningPreference;
import com.kong.kong_dic.domain.user.entity.User;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.util.Date;

@Getter
@Setter
@Builder
public class UserProfileResponseDto {
    private String id;
    private String userId;
    private String username;
    private String nickname;
    private String role;
    private Date registeredAt;
    private String email;
    private String avatarVariant;
    private String avatarSeed;
    private String profileImageUrl;
    private SeasoningPreference seasoningPreference;
    private long followerCount;
    private long followingCount;
    private long visitedCount;

    public static UserProfileResponseDto of(User user) {
        return of(user, 0L, 0L, 0L);
    }

    public static UserProfileResponseDto of(User user, long followerCount, long followingCount, long visitedCount) {
        return UserProfileResponseDto.builder()
                .id(user.getPublicId())
                .userId(user.getPublicId())
                .username(user.getUsername())
                .nickname(user.getNickname())
                .role(user.getRole().name())
                .registeredAt(user.getRegisteredAt())
                .email(user.getEmail())
                .avatarVariant(user.getAvatarVariant())
                .avatarSeed(user.getAvatarSeed())
                .profileImageUrl(user.getProfileImageUrl())
                .seasoningPreference(user.getSeasoningPreference() != null ? user.getSeasoningPreference() : SeasoningPreference.NONE)
                .followerCount(followerCount)
                .followingCount(followingCount)
                .visitedCount(visitedCount)
                .build();
    }
}
