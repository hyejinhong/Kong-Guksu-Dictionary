package com.kong.kong_dic_admin.domain.restaurant.submission.dto;

import com.kong.kong_dic.common.model.BeanPrice;
import com.kong.kong_dic_admin.domain.restaurant.submission.model.SubmissionStatus;
import lombok.*;

import java.util.List;

@Getter
@Setter
@ToString
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RestaurantSubmitRequestDto {

    private Long id;
    private String name;
    private String address;
    // private List<BeanType> beanTypes;

    private Boolean servesAllYear;

    private Integer startMonth;
    private Integer endMonth;

    private List<BeanPrice> prices;

    private Double latitude;
    private Double longitude;
    private SubmissionStatus status;

    private Long userId;
}
