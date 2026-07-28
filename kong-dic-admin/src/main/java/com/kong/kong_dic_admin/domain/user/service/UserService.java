package com.kong.kong_dic_admin.domain.user.service;

import com.kong.kong_dic_admin.domain.user.dto.AdminUserResponseDto;
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
import java.util.List;
import java.util.stream.Collectors;

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

    public List<AdminUserResponseDto> getAllUsers() {
        return userRepository.findAll().stream()
                .map(user -> AdminUserResponseDto.builder()
                        .id(user.getId())
                        .username(user.getUsername())
                        .nickname(user.getNickname())
                        .email(user.getEmail())
                        .role(user.getRole())
                        .registeredAt(user.getRegisteredAt())
                        .modifiedAt(user.getModifiedAt())
                        .enabled(user.isEnabled())
                        .build())
                .collect(Collectors.toList());
    }

    public void updateUserStatus(Long userId, boolean enabled) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 사용자입니다."));
        user.setEnabled(enabled);
        user.setModifiedAt(new Date(System.currentTimeMillis()));
        userRepository.save(user);
    }
}
