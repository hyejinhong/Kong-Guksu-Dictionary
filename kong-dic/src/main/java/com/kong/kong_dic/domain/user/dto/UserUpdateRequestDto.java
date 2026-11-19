package com.kong.kong_dic.domain.user.dto;

import lombok.Getter;
import lombok.ToString;

@Getter
@ToString(exclude = "password")
public class UserUpdateRequestDto {
    private String nickname;
    private String password;
}
