package com.kong.kong_dic.domain.restaurant.controller;

import com.kong.kong_dic.common.response.BaseResponse;
import com.kong.kong_dic.domain.restaurant.dto.RestaurantCommentRequestDto;
import com.kong.kong_dic.domain.restaurant.dto.RestaurantCommentResponseDto;
import com.kong.kong_dic.domain.restaurant.service.RestaurantCommentService;
import com.kong.kong_dic.global.annotation.AuthUser;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

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

    @PostMapping
    public ResponseEntity<BaseResponse<RestaurantCommentResponseDto>> addComment(@PathVariable Long restaurantId,
                                                                                 @RequestBody RestaurantCommentRequestDto request,
                                                                                 @AuthUser UserDetails userDetails) {
        return ResponseEntity.ok(BaseResponse.success(commentService.addComment(restaurantId, request, userDetails.getUsername())));
    }

    @DeleteMapping("/{commentId}")
    public ResponseEntity<BaseResponse<Void>> deleteComment(
            @PathVariable Long restaurantId,
            @PathVariable Long commentId,
            @AuthUser UserDetails userDetails) {
        commentService.deleteMyComment(restaurantId, commentId, userDetails.getUsername());
        return ResponseEntity.ok(BaseResponse.success());
    }
}
