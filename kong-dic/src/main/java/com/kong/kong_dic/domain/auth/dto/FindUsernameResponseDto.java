package com.kong.kong_dic.domain.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FindUsernameResponseDto {
    private String maskedUsername;
    private String registeredAt;
}
