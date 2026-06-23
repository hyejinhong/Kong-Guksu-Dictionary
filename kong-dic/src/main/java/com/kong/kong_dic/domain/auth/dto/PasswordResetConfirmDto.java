package com.kong.kong_dic.domain.auth.dto;

import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class PasswordResetConfirmDto {
    private String token;
    private String newPassword;
}
