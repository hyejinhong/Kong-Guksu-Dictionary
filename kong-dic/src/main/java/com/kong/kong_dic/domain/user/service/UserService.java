package com.kong.kong_dic.domain.user.service;

import com.kong.kong_dic.common.exception.BaseException;
import com.kong.kong_dic.domain.auth.exception.AuthExceptionType;
import com.kong.kong_dic.domain.user.dto.*;
import com.kong.kong_dic.domain.user.entity.User;
import com.kong.kong_dic.domain.user.exception.UserExceptionType;
import com.kong.kong_dic.domain.user.repository.UserRepository;
import com.kong.kong_dic.domain.user.util.NicknameGenerator;
import com.kong.kong_dic.global.service.RedisService;
import com.kong.kong_dic.global.service.EmailService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.apache.commons.lang3.StringUtils;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.sql.Date;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final RedisService redisService;
    private final EmailService emailService;

    private static final String EMAIL_VERIFICATION_PREFIX = "EV:";
    private static final long EMAIL_VERIFICATION_EXPIRATION = 5; // 5 minutes

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

    /**
     * 현재 로그인된 사용자 정보를 조회
     * @param username JWT 토큰에서 추출된 사용자 ID (username)
     * @return UserProfileResponseDto
     */
    public UserProfileResponseDto getMyProfile(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new BaseException(UserExceptionType.USER_NOT_FOUND)); // 예외 처리 로직에 맞게 수정

        return UserProfileResponseDto.of(user);
    }

    /**
     * 사용자 정보 수정 (닉네임, 비밀번호).
     * @param username JWT 토큰에서 추출된 사용자 ID
     * @param request 수정 요청 DTO
     * @return UserProfileResponseDto (수정된 정보)
     */
    @Transactional
    public UserProfileResponseDto updateMyProfile(String username, UserProfileUpdateRequestDto request) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new BaseException(UserExceptionType.USER_NOT_FOUND));

        // 1. 닉네임 수정 (값이 있을 경우에만)
        String newNickname = request.getNickname();
        if (newNickname != null && !newNickname.isBlank()) {
            if (!user.getNickname().equals(newNickname) && userRepository.existsByNickname(newNickname)) {
                throw new BaseException(UserExceptionType.DUPLICATED_NICKNAME);
            }
            user.setNickname(request.getNickname());
        }

        // 2. 비밀번호 수정 로직 (새 비밀번호가 제공된 경우)
        if (request.getNewPassword() != null && !request.getNewPassword().isBlank()) {
            if (request.getCurrentPassword() == null || request.getCurrentPassword().isBlank()) {
                throw new BaseException(UserExceptionType.INVALID_INPUT, "비밀번호 변경을 위해 현재 비밀번호를 입력해야 합니다.");
            }

            // 현재 비밀번호 일치 확인
            if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
                throw new BadCredentialsException("현재 비밀번호가 일치하지 않습니다."); // Security 예외 사용 또는 커스텀 예외
            }

            // 새 비밀번호 해싱 후 저장
            String hashedNewPassword = passwordEncoder.encode(request.getNewPassword());
            user.setPassword(hashedNewPassword);
        }

        // 3. 아바타 정보 수정
        if (request.getAvatarVariant() != null && !request.getAvatarVariant().isBlank()) {
            user.setAvatarVariant(request.getAvatarVariant());
        }
        if (request.getAvatarSeed() != null && !request.getAvatarSeed().isBlank()) {
            user.setAvatarSeed(request.getAvatarSeed());
        }

        // 4. 간/양념 취향 수정
        if (request.getSeasoningPreference() != null) {
            user.setSeasoningPreference(request.getSeasoningPreference());
        }

        User updatedUser = userRepository.save(user);
        return UserProfileResponseDto.of(updatedUser);
    }

    public void sendVerificationCode(String username, EmailVerificationRequestDto request) throws Exception {
        userRepository.findByUsername(username)
                .orElseThrow(() -> new BaseException(UserExceptionType.USER_NOT_FOUND));

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BaseException(AuthExceptionType.DUPLICATED_EMAIL);
        }

        String code = String.format("%06d", new java.util.Random().nextInt(1000000));

        redisService.setData(
                EMAIL_VERIFICATION_PREFIX + request.getEmail(),
                code,
                EMAIL_VERIFICATION_EXPIRATION,
                java.util.concurrent.TimeUnit.MINUTES
        );

        emailService.sendVerificationEmail(request.getEmail(), code);
    }

    @Transactional
    public UserProfileResponseDto verifyAndRegisterEmail(String username, EmailRegisterRequestDto request) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new BaseException(UserExceptionType.USER_NOT_FOUND));

        String savedCode = redisService.getData(EMAIL_VERIFICATION_PREFIX + request.getEmail());
        if (savedCode == null || !savedCode.equals(request.getCode())) {
            throw new BaseException(AuthExceptionType.INVALID_VERIFICATION_CODE);
        }

        user.setEmail(request.getEmail());
        User updatedUser = userRepository.save(user);

        redisService.deleteData(EMAIL_VERIFICATION_PREFIX + request.getEmail());

        return UserProfileResponseDto.of(updatedUser);
    }
}
