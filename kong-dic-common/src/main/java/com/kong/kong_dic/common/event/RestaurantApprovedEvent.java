package com.kong.kong_dic.common.event;

import com.kong.kong_dic.common.model.BeanPrice;
import lombok.*;

import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RestaurantApprovedEvent {
    private Long submissionId;
    private String name;
    private String address;
    private Double latitude;
    private Double longitude;
    private Boolean servesAllYear;
    private Integer startMonth;
    private Integer endMonth;
    private List<BeanPrice> prices;
    private Long userId;
}