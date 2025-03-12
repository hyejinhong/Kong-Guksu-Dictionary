package com.kong.kong_dic.domain.restaurant.dto;

import com.kong.kong_dic.domain.bean.BeanType;
import lombok.*;

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
    private Integer startMonth;
    private Integer endMonth;
    private Double distance;
}