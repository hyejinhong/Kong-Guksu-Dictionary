package com.kong.kong_dic.domain.auth.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

@Getter @Setter
@ToString(exclude = "password")
public class LoginRequestDto {
    private String username;
    private String password;
}
