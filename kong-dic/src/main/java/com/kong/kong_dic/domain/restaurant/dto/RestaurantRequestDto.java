package com.kong.kong_dic.domain.restaurant.dto;

import com.kong.kong_dic.domain.bean.BeanType;
import lombok.*;

import java.util.List;

@Getter
@Setter
@ToString
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RestaurantRequestDto {
    private String name;
    private String address;
    private Double latitude;
    private Double longitude;
    private List<BeanType> beanTypes;
    private Boolean servesAllYear;
    private Integer startMonth;
    private Integer endMonth;
}
