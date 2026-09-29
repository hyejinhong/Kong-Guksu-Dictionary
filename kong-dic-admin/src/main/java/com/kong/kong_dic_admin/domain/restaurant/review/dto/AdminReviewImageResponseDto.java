package com.kong.kong_dic_admin.domain.restaurant.review.dto;

import com.kong.kong_dic.common.model.BlindReason;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminReviewImageResponseDto {
    private Long id;
    private Long restaurantId;
    private String restaurantName;
    private Long userId;
    private String username;
    private String userNickname;
    private Double rating;
    private String memo;
    private String imageUrl;
    private Boolean isImageBlinded;
    private BlindReason imageBlindReason;
    private String imageBlindReasonDescription;
    private LocalDateTime imageBlindedAt;
    private LocalDate visitDate;
}
