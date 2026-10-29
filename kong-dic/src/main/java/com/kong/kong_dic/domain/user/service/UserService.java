package com.kong.kong_dic.domain.user.service;

import com.kong.kong_dic.common.exception.BaseException;
import com.kong.kong_dic.domain.auth.exception.AuthExceptionType;
import com.kong.kong_dic.domain.follow.repository.FollowRepository;
import com.kong.kong_dic.domain.image.exception.ImageExceptionType;
import com.kong.kong_dic.domain.image.service.ImageUploadService;
import com.kong.kong_dic.domain.user.dto.*;
import com.kong.kong_dic.domain.user.entity.User;
import com.kong.kong_dic.domain.user.exception.UserExceptionType;
import com.kong.kong_dic.domain.user.repository.UserRepository;
import com.kong.kong_dic.domain.user.repository.UserRestaurantVisitRepository;
import com.kong.kong_dic.domain.user.util.NicknameGenerator;
import com.kong.kong_dic.global.service.EmailService;
import com.kong.kong_dic.global.service.RedisService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.apache.commons.lang3.StringUtils;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.sql.Date;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final RedisService redisService;
    private final EmailService emailService;
    private final ImageUploadService imageUploadService;
    private final FollowRepository followRepository;
    private final UserRestaurantVisitRepository visitRepository;

    private static final String EMAIL_VERIFICATION_PREFIX = "EV:";
    private static final long EMAIL_VERIFICATION_EXPIRATION = 5; // 5 minutes

    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void backfillMissingPublicIds() {
        List<User> usersWithoutPublicId = userRepository.findAllByPublicIdIsNull();
        if (usersWithoutPublicId != null && !usersWithoutPublicId.isEmpty()) {
            for (User u : usersWithoutPublicId) {
                u.setPublicId(UUID.randomUUID().toString());
            }
            userRepository.saveAll(usersWithoutPublicId);
        }
    }

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
                .orElseThrow(() -> new BaseException(UserExceptionType.USER_NOT_FOUND));

        long followerCount = followRepository != null ? followRepository.countByFollowingId(user.getId()) : 0L;
        long followingCount = followRepository != null ? followRepository.countByFollowerId(user.getId()) : 0L;
        long visitedCount = visitRepository != null ? visitRepository.countByUserId(user.getId()) : 0L;

        return UserProfileResponseDto.of(user, followerCount, followingCount, visitedCount);
    }

    /**
     * 특정 사용자의 공개 프로필 및 사전 요약 정보를 조회 (publicId 기반)
     */
    public PublicUserProfileResponseDto getUserProfile(String targetPublicId, String currentUsername) {
        User targetUser = userRepository.findByPublicId(targetPublicId)
                .orElseThrow(() -> new BaseException(UserExceptionType.USER_NOT_FOUND));

        Long targetUserId = targetUser.getId();
        long visitedCount = visitRepository != null ? visitRepository.countByUserId(targetUserId) : 0L;
        long followerCount = followRepository != null ? followRepository.countByFollowingId(targetUserId) : 0L;
        long followingCount = followRepository != null ? followRepository.countByFollowerId(targetUserId) : 0L;

        boolean isFollowing = false;
        boolean isMe = false;

        if (currentUsername != null && !currentUsername.isBlank()) {
            Optional<User> currentUserOpt = userRepository.findByUsername(currentUsername);
            if (currentUserOpt.isPresent()) {
                User currentUser = currentUserOpt.get();
                isMe = currentUser.getId().equals(targetUserId);
                if (!isMe && followRepository != null) {
                    isFollowing = followRepository.existsByFollowerIdAndFollowingId(currentUser.getId(), targetUserId);
                }
            }
        }

        return PublicUserProfileResponseDto.of(
                targetUser,
                visitedCount,
                followerCount,
                followingCount,
                isFollowing,
                isMe
        );
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
                throw new BadCredentialsException("현재 비밀번호가 일치하지 않습니다.");
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

        // 4. 프로필 이미지 수정
        if (Boolean.TRUE.equals(request.getResetProfileImage()) || (request.getProfileImageUrl() != null && request.getProfileImageUrl().isBlank())) {
            // 프로필 이미지 초기화 (기본 그래픽 아바타 사용)
            String oldProfileUrl = user.getProfileImageUrl();
            user.setProfileImageUrl(null);
            if (oldProfileUrl != null && !oldProfileUrl.isBlank()
                    && !userRepository.existsByProfileImageUrlAndIdNot(oldProfileUrl, user.getId())) {
                imageUploadService.deleteImage(oldProfileUrl);
            }
        } else if (request.getProfileImageUrl() != null && !request.getProfileImageUrl().isBlank()) {
            String newProfileUrl = request.getProfileImageUrl().trim();
            imageUploadService.validateImageUrl(newProfileUrl, "profiles");

            // 다른 유저가 이미 사용 중인 프로필 이미지 URL 도용 차단 (IDOR 방지)
            if (userRepository.existsByProfileImageUrlAndIdNot(newProfileUrl, user.getId())) {
                throw new BaseException(ImageExceptionType.INVALID_IMAGE_URL);
            }

            String oldProfileUrl = user.getProfileImageUrl();
            user.setProfileImageUrl(newProfileUrl);
            if (oldProfileUrl != null && !oldProfileUrl.equals(newProfileUrl)
                    && !userRepository.existsByProfileImageUrlAndIdNot(oldProfileUrl, user.getId())) {
                imageUploadService.deleteImage(oldProfileUrl);
            }
        }

        // 5. 간/양념 취향 수정
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
