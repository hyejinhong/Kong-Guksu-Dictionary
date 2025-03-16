package com.kong.kong_dic.domain.restaurant.controller;

import com.kong.kong_dic.domain.restaurant.dto.RestaurantSubmitRequestDto;
import com.kong.kong_dic.domain.restaurant.service.RestaurantSubmitService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/restaurants/submissions")
@RequiredArgsConstructor
public class RestaurantSubmitController {

    private final RestaurantSubmitService submitService;

    @GetMapping
    public List<RestaurantSubmitRequestDto> getAllSubmissions() {
        return submitService.getAllSubmissions();
    }

    @GetMapping("/{id}")
    public RestaurantSubmitRequestDto getSubmission(@PathVariable Long id) {
        return submitService.getSubmission(id);
    }

    @PostMapping
    public void addRestaurantSubmission(@RequestBody RestaurantSubmitRequestDto request) {
        submitService.addRestaurantSubmission(request);
    }

    @PatchMapping("/{id}/approve")
    public void approveRestaurantSubmission(@PathVariable Long id) {
        submitService.approveSubmission(id);
    }

    @PatchMapping("/{id}/reject)")
    public void rejectRestaurantSubmission(@PathVariable Long id) {
        submitService.rejectSubmission(id);
    }
}

