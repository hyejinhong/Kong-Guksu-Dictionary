package com.kong.kong_dic.domain.restaurant.dto;

import com.kong.kong_dic.domain.user.entity.SeasoningPreference;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class RestaurantCommentResponseDto {
    private Long id;
    private String nickname;
    private String content;
    private LocalDateTime createdAt;
    private String avatarVariant;
    private String avatarSeed;
    private SeasoningPreference seasoningPreference;
}
