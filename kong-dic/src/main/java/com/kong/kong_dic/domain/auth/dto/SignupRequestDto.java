package com.kong.kong_dic.domain.auth.dto;

import com.kong.kong_dic.domain.user.entity.SeasoningPreference;
import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class SignupRequestDto {
    private String username;
    private String password;
    private String nickname;
    private String email;
    private SeasoningPreference seasoningPreference;
}
