package com.kong.kong_dic_admin.domain.auth.dto;

import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class LoginRequestDto {
    private String username;
    private String password;
}