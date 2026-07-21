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
    private Long id;
    private String username;
    private String nickname;
    private String role;
    private Date registeredAt;
    private String email;
    private String avatarVariant;
    private String avatarSeed;
    private SeasoningPreference seasoningPreference;

    public static UserProfileResponseDto of(User user) {
        return UserProfileResponseDto.builder()
                .id(user.getId())
                .username(user.getUsername())
                .nickname(user.getNickname())
                .role(user.getRole().name())
                .registeredAt(user.getRegisteredAt())
                .email(user.getEmail())
                .avatarVariant(user.getAvatarVariant())
                .avatarSeed(user.getAvatarSeed())
                .seasoningPreference(user.getSeasoningPreference() != null ? user.getSeasoningPreference() : SeasoningPreference.NONE)
                .build();
    }
}