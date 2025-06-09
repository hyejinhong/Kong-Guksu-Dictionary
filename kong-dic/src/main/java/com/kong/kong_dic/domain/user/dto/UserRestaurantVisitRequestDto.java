package com.kong.kong_dic.domain.user.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter @Setter
public class UserRestaurantVisitRequestDto {
    private Long restaurantId;
    private LocalDate visitDate;
    private Integer rating;
    private String memo;
}
