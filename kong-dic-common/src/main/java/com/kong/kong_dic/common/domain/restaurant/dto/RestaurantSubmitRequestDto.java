package com.kong.kong_dic.common.domain.restaurant.dto;

import com.kong.kong_dic.common.model.BeanPrice;
import com.kong.kong_dic.common.domain.restaurant.model.SubmissionStatus;
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
    private Long restaurantId;
    private String submitterName;
    private String submitterNickname;
    private String rejectReason;
}
