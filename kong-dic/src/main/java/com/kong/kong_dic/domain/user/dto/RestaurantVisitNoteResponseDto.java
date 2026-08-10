package com.kong.kong_dic.domain.user.dto;

import com.kong.kong_dic.domain.user.entity.SeasoningPreference;
import lombok.*;

import java.time.LocalDate;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RestaurantVisitNoteResponseDto {
    private Long id;
    private Long userId;
    private String nickname;
    private String avatarVariant;
    private String avatarSeed;
    private SeasoningPreference seasoningPreference;
    private Double rating;
    private String memo;
    private LocalDate visitDate;
}
