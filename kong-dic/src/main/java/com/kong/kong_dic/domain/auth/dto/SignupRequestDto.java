package com.kong.kong_dic.domain.auth.dto;

import com.kong.kong_dic.domain.user.entity.SeasoningPreference;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

@Getter @Setter
@ToString(exclude = "password")
public class SignupRequestDto {
    private String username;
    private String password;
    private String nickname;
    private String email;
    private SeasoningPreference seasoningPreference;
}
