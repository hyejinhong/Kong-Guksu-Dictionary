package com.kong.kong_dic.domain.user.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

@Getter @Setter
@ToString(exclude = "code")
public class EmailRegisterRequestDto {
    private String email;
    private String code;
}
