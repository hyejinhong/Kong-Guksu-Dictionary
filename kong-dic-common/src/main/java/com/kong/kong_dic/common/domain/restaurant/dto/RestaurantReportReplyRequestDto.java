package com.kong.kong_dic.common.domain.restaurant.dto;

import com.kong.kong_dic.common.domain.restaurant.model.ReportStatus;
import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RestaurantReportReplyRequestDto {
    private String reply;
    private ReportStatus status;
}
