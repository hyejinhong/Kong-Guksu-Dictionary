package com.kong.kong_dic.domain.user.dto;

import lombok.Getter;

@Getter
public class UserUpdateRequestDto {
    private String nickname;
    private String password;
}
