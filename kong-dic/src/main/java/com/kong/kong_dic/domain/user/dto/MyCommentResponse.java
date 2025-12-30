package com.kong.kong_dic.domain.user.dto;

import com.kong.kong_dic.domain.restaurant.entity.RestaurantComment;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class MyCommentResponse {
    private Long commentId;
    private String content;
    private Long restaurantId;
    private String restaurantName;
    private LocalDateTime createdAt;

    // Entity -> DTO 변환
    public static MyCommentResponse from(RestaurantComment comment) {
        return MyCommentResponse.builder()
                .commentId(comment.getId())
                .content(comment.getContent())
                .restaurantId(comment.getRestaurant().getId())
                .restaurantName(comment.getRestaurant().getName())
                .createdAt(comment.getCreatedAt())
                .build();
    }
}