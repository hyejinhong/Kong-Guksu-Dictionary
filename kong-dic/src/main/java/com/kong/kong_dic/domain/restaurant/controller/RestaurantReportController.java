package com.kong.kong_dic.domain.restaurant.controller;

import com.kong.kong_dic.common.domain.restaurant.dto.RestaurantReportRequestDto;
import com.kong.kong_dic.common.domain.restaurant.dto.RestaurantReportResponseDto;
import com.kong.kong_dic.common.response.BaseResponse;
import com.kong.kong_dic.domain.restaurant.service.RestaurantReportService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/restaurants")
@RequiredArgsConstructor
public class RestaurantReportController {

    private final RestaurantReportService reportService;

    @PostMapping("/{restaurantId}/reports")
    public ResponseEntity<BaseResponse<Void>> createReport(
            @PathVariable Long restaurantId,
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody RestaurantReportRequestDto request) {
        
        String username = userDetails != null ? userDetails.getUsername() : null;
        reportService.createReport(restaurantId, username, request);
        return ResponseEntity.ok(BaseResponse.success());
    }

    @GetMapping("/{restaurantId}/reports")
    public ResponseEntity<BaseResponse<List<RestaurantReportResponseDto>>> getReports(
            @PathVariable Long restaurantId) {
        
        List<RestaurantReportResponseDto> reports = reportService.getReportsByRestaurant(restaurantId);
        return ResponseEntity.ok(BaseResponse.success(reports));
    }
}
