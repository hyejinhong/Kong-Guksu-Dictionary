package com.kong.kong_dic_admin.domain.restaurant.submission.controller;

import com.kong.kong_dic.common.domain.restaurant.dto.RestaurantSubmitRequestDto;
import com.kong.kong_dic.common.response.BaseResponse;
import com.kong.kong_dic_admin.domain.restaurant.submission.service.RestaurantSubmitAdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/admin/restaurants/submissions")
@RequiredArgsConstructor
public class RestaurantSubmitAdminController {

    private final RestaurantSubmitAdminService submitAdminService;

    @GetMapping
    public ResponseEntity<BaseResponse<List<RestaurantSubmitRequestDto>>> getAllSubmissions() {
        return ResponseEntity.ok(BaseResponse.success(submitAdminService.getAllSubmissions()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<BaseResponse<RestaurantSubmitRequestDto>> getSubmission(@PathVariable Long id) {
        return ResponseEntity.ok(BaseResponse.success(submitAdminService.getSubmission(id)));
    }

    @PatchMapping("/{id}/approve")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<BaseResponse<Void>> approveRestaurantSubmission(@PathVariable Long id) {
        submitAdminService.approveSubmission(id);
        return ResponseEntity.ok(BaseResponse.success());
    }

    @PatchMapping("/{id}/reject")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<BaseResponse<Void>> rejectRestaurantSubmission(
            @PathVariable Long id,
            @RequestBody(required = false) java.util.Map<String, String> body) {
        String rejectReason = body != null ? body.get("rejectReason") : null;
        submitAdminService.rejectSubmission(id, rejectReason);
        return ResponseEntity.ok(BaseResponse.success());
    }

}
