package com.kong.kong_dic_admin.domain.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.util.Date;

@Getter @Setter
@Builder
@AllArgsConstructor
public class LoginResponseDto {
    private String token;
    private Date exp;
}
