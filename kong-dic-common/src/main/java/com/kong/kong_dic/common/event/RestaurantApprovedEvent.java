package com.kong.kong_dic.common.event;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.kong.kong_dic.common.model.BeanPrice;
import lombok.*;

import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RestaurantApprovedEvent {
    @JsonProperty("submissionId")
    private Long submissionId;
    
    @JsonProperty("name")
    private String name;
    
    @JsonProperty("address")
    private String address;
    
    @JsonProperty("latitude")
    private Double latitude;
    
    @JsonProperty("longitude")
    private Double longitude;
    
    @JsonProperty("servesAllYear")
    private Boolean servesAllYear;
    
    @JsonProperty("startMonth")
    private Integer startMonth;
    
    @JsonProperty("endMonth")
    private Integer endMonth;
    
    @JsonProperty("prices")
    private List<BeanPrice> prices;
    
    @JsonProperty("userId")
    private Long userId;
}