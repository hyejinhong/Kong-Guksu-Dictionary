package com.kong.kong_dic.domain.restaurant.controller;

import com.kong.kong_dic.common.domain.restaurant.dto.RestaurantSubmitRequestDto;
import com.kong.kong_dic.common.response.BaseResponse;
import com.kong.kong_dic.domain.restaurant.service.RestaurantSubmitService;
import com.kong.kong_dic.domain.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/restaurants/submissions")
@RequiredArgsConstructor
public class RestaurantSubmitController {

    private final RestaurantSubmitService submitService;

    @GetMapping
    public ResponseEntity<BaseResponse<List<RestaurantSubmitRequestDto>>> getAllSubmissions() {
        return ResponseEntity.ok(BaseResponse.success(submitService.getAllSubmissions()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<BaseResponse<RestaurantSubmitRequestDto>> getSubmission(@PathVariable Long id) {
        return ResponseEntity.ok(BaseResponse.success(submitService.getSubmission(id)));
    }

    @PostMapping
    public ResponseEntity<BaseResponse<Void>> addRestaurantSubmission(@AuthenticationPrincipal User user, @RequestBody RestaurantSubmitRequestDto request) {
        submitService.addRestaurantSubmission(user, request);
        return ResponseEntity.ok(BaseResponse.success());
    }

    @PatchMapping("/{id}/approve")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<BaseResponse<Void>> approveRestaurantSubmission(@PathVariable Long id) {
        submitService.approveSubmission(id);
        return ResponseEntity.ok(BaseResponse.success());
    }

    @PatchMapping("/{id}/reject")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<BaseResponse<Void>> rejectRestaurantSubmission(@PathVariable Long id) {
        submitService.rejectSubmission(id);
        return ResponseEntity.ok(BaseResponse.success());
    }
}

