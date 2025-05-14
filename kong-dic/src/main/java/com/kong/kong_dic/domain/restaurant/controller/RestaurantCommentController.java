package com.kong.kong_dic.domain.restaurant.controller;

import com.kong.kong_dic.domain.restaurant.dto.RestaurantCommentResponseDto;
import com.kong.kong_dic.domain.restaurant.service.RestaurantCommentService;
import com.kong.kong_dic.global.response.BaseResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/restaurants/{restaurantId}/comments")
public class RestaurantCommentController {

    private final RestaurantCommentService commentService;

    @GetMapping
    public ResponseEntity<BaseResponse<Page<RestaurantCommentResponseDto>>> getComments(@PathVariable Long restaurantId,
                                                          @RequestParam(defaultValue = "0") int page,
                                                          @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(BaseResponse.success(commentService.getComments(restaurantId, page, size)));
    }
}
