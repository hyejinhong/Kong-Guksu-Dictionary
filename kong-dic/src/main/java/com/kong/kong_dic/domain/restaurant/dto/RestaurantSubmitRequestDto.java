package com.kong.kong_dic.domain.restaurant.dto;

import com.kong.kong_dic.domain.bean.BeanType;
import com.kong.kong_dic.domain.restaurant.entity.SubmissionStatus;
import lombok.*;

import java.util.List;

@Getter
@Setter
@ToString
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RestaurantSubmitRequestDto {

    private String name;
    private String address;
    private List<BeanType> beanTypes;

    private Boolean servesAllYear;

    private Integer startMonth;
    private Integer endMonth;

    private Double latitude;
    private Double longitude;
    private SubmissionStatus status;
}
