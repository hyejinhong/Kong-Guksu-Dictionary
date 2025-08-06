package com.kong.kong_dic_admin.domain.user.service;

import com.kong.kong_dic_admin.domain.user.dto.UserResponseDto;
import com.kong.kong_dic_admin.domain.user.dto.UserUpdateRequestDto;
import com.kong.kong_dic_admin.domain.user.entity.User;
import com.kong.kong_dic_admin.domain.user.repository.UserRepository;
import com.kong.kong_dic_admin.domain.user.util.NicknameGenerator;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.sql.Date;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

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
            user.setPassword(passwordEncoder.encode(request.getPassword()));

        user.setModifiedAt(new Date(System.currentTimeMillis()));
        userRepository.save(user);
    }

    public String getRandomNickname() {
        return NicknameGenerator.generate();
    }
}
