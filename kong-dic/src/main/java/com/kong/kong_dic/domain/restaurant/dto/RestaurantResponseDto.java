package com.kong.kong_dic.domain.restaurant.dto;

import com.kong.kong_dic.common.model.BeanType;
import com.kong.kong_dic.common.model.BeanPrice;
import lombok.*;

import java.util.List;

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
    private List<BeanType> beanTypes;
    private Boolean servesAllYear;
    private Integer startMonth;
    private Integer endMonth;
    private Double distance;
    private List<BeanPrice> prices;
    private Boolean isSaved;
    private Double averageRating;
    private Long totalScraps;
}