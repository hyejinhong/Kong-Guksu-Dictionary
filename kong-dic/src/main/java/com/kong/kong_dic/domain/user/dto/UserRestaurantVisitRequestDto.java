package com.kong.kong_dic.domain.user.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Getter @Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserRestaurantVisitRequestDto {
    private Long restaurantId;
    private LocalDate visitDate;
    private Double rating;
    private String memo;
    private String imageUrl;
}
