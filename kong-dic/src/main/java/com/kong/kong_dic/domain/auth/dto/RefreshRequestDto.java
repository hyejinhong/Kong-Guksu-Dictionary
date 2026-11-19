package com.kong.kong_dic.domain.auth.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

@Getter @Setter
@ToString(exclude = "refreshToken")
public class RefreshRequestDto {
    private String refreshToken;
}
