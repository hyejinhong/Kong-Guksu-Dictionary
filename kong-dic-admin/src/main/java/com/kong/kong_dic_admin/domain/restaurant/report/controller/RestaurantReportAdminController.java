package com.kong.kong_dic_admin.domain.restaurant.report.controller;

import com.kong.kong_dic.common.domain.restaurant.dto.RestaurantReportReplyRequestDto;
import com.kong.kong_dic.common.domain.restaurant.dto.RestaurantReportResponseDto;
import com.kong.kong_dic.common.domain.restaurant.model.ReportStatus;
import com.kong.kong_dic.common.response.BaseResponse;
import com.kong.kong_dic_admin.domain.restaurant.report.service.RestaurantReportAdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/restaurant-reports")
@RequiredArgsConstructor
public class RestaurantReportAdminController {

    private final RestaurantReportAdminService adminService;

    @GetMapping
    public ResponseEntity<BaseResponse<List<RestaurantReportResponseDto>>> getAllReports() {
        return ResponseEntity.ok(BaseResponse.success(adminService.getAllReports()));
    }

    @PatchMapping("/{reportId}/status")
    public ResponseEntity<BaseResponse<Void>> updateStatus(
            @PathVariable Long reportId,
            @RequestParam ReportStatus status) {
        adminService.updateReportStatus(reportId, status);
        return ResponseEntity.ok(BaseResponse.success());
    }

    @PostMapping("/{reportId}/reply")
    public ResponseEntity<BaseResponse<Void>> replyToReport(
            @PathVariable Long reportId,
            @RequestBody RestaurantReportReplyRequestDto request) {
        adminService.replyToReport(reportId, request);
        return ResponseEntity.ok(BaseResponse.success());
    }
}
