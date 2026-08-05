package com.kong.kong_dic.common.domain.restaurant.dto;

import com.kong.kong_dic.common.domain.restaurant.model.ReportCategory;
import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RestaurantReportRequestDto {
    private ReportCategory category;
    private String content;
}
