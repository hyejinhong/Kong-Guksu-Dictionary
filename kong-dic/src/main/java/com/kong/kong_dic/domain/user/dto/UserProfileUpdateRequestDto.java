package com.kong.kong_dic.domain.user.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UserProfileUpdateRequestDto {
    private String nickname;
    private String currentPassword; // 기존 비밀번호 확인용
    private String newPassword;     // 새 비밀번호
    private String avatarVariant;
    private String avatarSeed;
}