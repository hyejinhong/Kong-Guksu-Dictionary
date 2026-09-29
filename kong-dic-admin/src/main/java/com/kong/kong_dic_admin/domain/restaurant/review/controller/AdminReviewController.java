package com.kong.kong_dic_admin.domain.restaurant.review.controller;

import com.kong.kong_dic.common.response.BaseResponse;
import com.kong.kong_dic_admin.domain.restaurant.review.dto.AdminReviewImageBlindRequestDto;
import com.kong.kong_dic_admin.domain.restaurant.review.dto.AdminReviewImageResponseDto;
import com.kong.kong_dic_admin.domain.restaurant.review.service.AdminReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/reviews")
@RequiredArgsConstructor
public class AdminReviewController {

    private final AdminReviewService adminReviewService;

    @GetMapping("/images")
    public ResponseEntity<BaseResponse<Page<AdminReviewImageResponseDto>>> getReviewImages(
            @RequestParam(value = "filter", defaultValue = "ALL") String filter,
            @PageableDefault(size = 12, sort = "id", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<AdminReviewImageResponseDto> result = adminReviewService.getReviewImages(filter, pageable);
        return ResponseEntity.ok(BaseResponse.success(result));
    }

    @PatchMapping("/{id}/blind-image")
    public ResponseEntity<BaseResponse<Void>> setBlindStatus(
            @PathVariable("id") Long id,
            @RequestBody AdminReviewImageBlindRequestDto request) {
        adminReviewService.setBlindStatus(id, request);
        return ResponseEntity.ok(BaseResponse.success());
    }
}
