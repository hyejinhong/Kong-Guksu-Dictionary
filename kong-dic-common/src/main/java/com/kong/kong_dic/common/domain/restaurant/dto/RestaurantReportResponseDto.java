package com.kong.kong_dic.common.domain.restaurant.dto;

import com.kong.kong_dic.common.domain.restaurant.model.ReportCategory;
import com.kong.kong_dic.common.domain.restaurant.model.ReportStatus;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RestaurantReportResponseDto {
    private Long id;
    private Long restaurantId;
    private String restaurantName;
    private Long userId;
    private String userNickname;
    private ReportCategory category;
    private String categoryDescription;
    private String content;
    private ReportStatus status;
    private String reply;
    private LocalDateTime repliedAt;
    private LocalDateTime createdAt;
}
