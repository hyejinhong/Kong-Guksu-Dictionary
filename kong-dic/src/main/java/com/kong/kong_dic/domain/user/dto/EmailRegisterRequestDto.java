package com.kong.kong_dic.domain.user.dto;

import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class EmailRegisterRequestDto {
    private String email;
    private String code;
}
