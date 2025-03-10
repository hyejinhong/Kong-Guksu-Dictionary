package com.kong.kong_dic.domain.restaurant.dto;

import com.kong.kong_dic.domain.bean.BeanType;
import lombok.*;

import java.time.LocalDate;

@Getter @Setter @ToString
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RestaurantResponseDto {
    private Long id;
    private String name;
    private String address;
    private Double latitude;
    private Double longitude;
    private BeanType beanType;
    private Boolean servesAllYear;
    private LocalDate startDate;
    private LocalDate endDate;
    private Double distance;
}