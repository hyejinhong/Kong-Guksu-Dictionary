package com.kong.kong_dic.domain.user.service;

import com.kong.kong_dic.domain.user.dto.UserResponseDto;
import com.kong.kong_dic.domain.user.dto.UserUpdateRequestDto;
import com.kong.kong_dic.domain.user.entity.User;
import com.kong.kong_dic.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.apache.commons.lang3.StringUtils;
import org.springframework.stereotype.Service;

import java.sql.Date;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    public UserResponseDto getMyInfo(User user) {
        return UserResponseDto.builder()
                .username(user.getUsername())
                .nickname(user.getNickname())
                .registeredAt(user.getRegisteredAt())
                .modifiedAt(user.getModifiedAt())
                .build();
    }

    public void updateMyInfo(User user, UserUpdateRequestDto request) {
        if (!StringUtils.isEmpty(request.getNickname()))
            user.setNickname(request.getNickname());
        if (!StringUtils.isEmpty(request.getPassword()))
            user.setPassword(request.getPassword());

        user.setModifiedAt(new Date(System.currentTimeMillis()));
        userRepository.save(user);
    }
}
