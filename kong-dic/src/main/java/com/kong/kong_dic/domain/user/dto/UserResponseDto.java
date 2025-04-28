package com.kong.kong_dic.domain.user.dto;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.sql.Date;

@Builder
@Getter @Setter
public class UserResponseDto {
    private String username;
    private String nickname;
    private Date registeredAt;
    private Date modifiedAt;
}
