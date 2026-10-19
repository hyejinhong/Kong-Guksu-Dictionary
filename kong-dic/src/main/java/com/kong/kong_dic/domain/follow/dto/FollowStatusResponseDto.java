package com.kong.kong_dic.domain.follow.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FollowStatusResponseDto {
    private Boolean isFollowing;
    private long followerCount;
    private long followingCount;
}
