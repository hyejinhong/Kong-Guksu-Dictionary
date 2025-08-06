package com.kong.kong_dic_admin.domain.user.dto;

import lombok.Getter;

@Getter
public class UserUpdateRequestDto {
    private String nickname;
    private String password;
}
