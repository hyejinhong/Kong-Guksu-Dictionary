package com.kong.kong_dic_admin.domain.user.dto;

import com.kong.kong_dic.domain.restaurant.dto.RestaurantResponseDto;
import lombok.*;

import java.time.LocalDate;

// 필요하다면 다른 시간 관련 import 추가 (예: java.time.LocalDateTime)

@Getter @Setter @Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserRestaurantVisitResponseDto {

    private Long id;
    private RestaurantResponseDto restaurant;

    private LocalDate visitedDate;
    private Integer rating;
    private String memo;
}