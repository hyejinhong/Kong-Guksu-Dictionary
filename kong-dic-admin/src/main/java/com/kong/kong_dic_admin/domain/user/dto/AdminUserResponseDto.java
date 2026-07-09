package com.kong.kong_dic_admin.domain.user.dto;

import com.kong.kong_dic_admin.domain.user.entity.Role;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.sql.Date;

@Builder
@Getter @Setter
public class AdminUserResponseDto {
    private Long id;
    private String username;
    private String nickname;
    private String email;
    private Role role;
    private Date registeredAt;
    private Date modifiedAt;
    private boolean enabled;
}
