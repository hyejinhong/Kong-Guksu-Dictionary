package com.kong.kong_dic.domain.follow.controller;

import com.kong.kong_dic.common.response.BaseResponse;
import com.kong.kong_dic.domain.follow.dto.FollowStatusResponseDto;
import com.kong.kong_dic.domain.follow.dto.FollowUserResponseDto;
import com.kong.kong_dic.domain.follow.service.FollowService;
import com.kong.kong_dic.global.annotation.AuthUser;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/users/{userId}")
@RequiredArgsConstructor
public class FollowController {

    private final FollowService followService;

    /**
     * 팔로우 / 언팔로우 토글 API (publicId 기반)
     */
    @PostMapping("/follow")
    public ResponseEntity<BaseResponse<FollowStatusResponseDto>> toggleFollow(
            @AuthUser UserDetails userDetails,
            @PathVariable String userId) {
        FollowStatusResponseDto result = followService.toggleFollow(userDetails.getUsername(), userId);
        String message = Boolean.TRUE.equals(result.getIsFollowing())
                ? "팔로우했습니다."
                : "팔로우를 취소했습니다.";
        return ResponseEntity.ok(BaseResponse.success(message, result));
    }

    /**
     * 팔로우 상태 및 팔로워/팔로잉 카운트 조회 API (publicId 기반)
     */
    @GetMapping("/follow/status")
    public ResponseEntity<BaseResponse<FollowStatusResponseDto>> getFollowStatus(
            @AuthUser(required = false) UserDetails userDetails,
            @PathVariable String userId) {
        String currentUsername = userDetails != null ? userDetails.getUsername() : null;
        return ResponseEntity.ok(BaseResponse.success(followService.getFollowStatus(currentUsername, userId)));
    }

    /**
     * 특정 유저의 팔로워 목록 조회 API (publicId 기반)
     */
    @GetMapping("/followers")
    public ResponseEntity<BaseResponse<Page<FollowUserResponseDto>>> getFollowers(
            @AuthUser(required = false) UserDetails userDetails,
            @PathVariable String userId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        String currentUsername = userDetails != null ? userDetails.getUsername() : null;
        return ResponseEntity.ok(BaseResponse.success(followService.getFollowers(userId, currentUsername, pageable)));
    }

    /**
     * 특정 유저의 팔로잉 목록 조회 API (publicId 기반)
     */
    @GetMapping("/followings")
    public ResponseEntity<BaseResponse<Page<FollowUserResponseDto>>> getFollowings(
            @AuthUser(required = false) UserDetails userDetails,
            @PathVariable String userId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        String currentUsername = userDetails != null ? userDetails.getUsername() : null;
        return ResponseEntity.ok(BaseResponse.success(followService.getFollowings(userId, currentUsername, pageable)));
    }
}
