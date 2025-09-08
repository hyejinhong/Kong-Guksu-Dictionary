package com.kong.kong_dic_admin.domain.auth.dto;

import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class SignupRequestDto {
    private String username;
    private String password;
    private String nickname;
}
