package com.kong.kong_dic.domain.auth.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

@Getter @Setter
@ToString(exclude = {"token", "newPassword"})
public class PasswordResetConfirmDto {
    private String token;
    private String newPassword;
}
