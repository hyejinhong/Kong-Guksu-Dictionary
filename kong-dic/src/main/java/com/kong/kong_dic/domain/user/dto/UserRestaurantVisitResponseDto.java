package com.kong.kong_dic.domain.user.dto;

import com.kong.kong_dic.domain.restaurant.dto.RestaurantResponseDto;
import lombok.*;

import java.time.LocalDate;

@Getter @Setter @Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserRestaurantVisitResponseDto {

    private Long id;
    private RestaurantResponseDto restaurant;

    private LocalDate visitedDate;
    private Double rating;
    private String memo;
}