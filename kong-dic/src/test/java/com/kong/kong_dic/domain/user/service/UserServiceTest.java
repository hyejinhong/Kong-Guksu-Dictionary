package com.kong.kong_dic.domain.user.service;

import com.kong.kong_dic.common.exception.BaseException;
import com.kong.kong_dic.domain.auth.exception.AuthExceptionType;
import com.kong.kong_dic.domain.user.dto.EmailRegisterRequestDto;
import com.kong.kong_dic.domain.user.dto.EmailVerificationRequestDto;
import com.kong.kong_dic.domain.user.dto.UserProfileResponseDto;
import com.kong.kong_dic.domain.user.dto.UserProfileUpdateRequestDto;
import com.kong.kong_dic.domain.user.entity.Role;
import com.kong.kong_dic.domain.user.entity.User;
import com.kong.kong_dic.domain.user.exception.UserExceptionType;
import com.kong.kong_dic.domain.user.repository.UserRepository;
import com.kong.kong_dic.global.service.EmailService;
import com.kong.kong_dic.global.service.RedisService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.sql.Date;
import java.util.Optional;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private RedisService redisService;

    @Mock
    private EmailService emailService;

    @Mock
    private com.kong.kong_dic.domain.image.service.ImageUploadService imageUploadService;

    @InjectMocks
    private UserService userService;

    private User testUser;
    private final String USERNAME = "testuser";
    private final String HASHED_PASSWORD = "hashedPassword123";
    private final String CURRENT_PASSWORD = "currentPassword";
    private final String NEW_PASSWORD = "newPassword456";

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .id(1L)
                .username(USERNAME)
                .password(HASHED_PASSWORD)
                .nickname("oldNickname")
                .role(Role.USER)
                .registeredAt(new Date(System.currentTimeMillis()))
                .build();
    }

    @Test
    @DisplayName("성공 : 닉네임만 수정")
    void updateMyProfile_shouldUpdateNicknameOnly() {
        // Given
        UserProfileUpdateRequestDto request = new UserProfileUpdateRequestDto();
        request.setNickname("newNickname");

        // DB 조회시 testUser 반환
        when(userRepository.findByUsername(USERNAME)).thenReturn(Optional.of(testUser));
        // 중복이 없다고 가정
        when(userRepository.existsByNickname("newNickname")).thenReturn(false);
        // DB 저장시 testUser (수정된 닉네임) 반환 설정
        when(userRepository.save(any(User.class))).thenReturn(testUser);


        // When
        UserProfileResponseDto result = userService.updateMyProfile(USERNAME, request);

        // Then
        // 닉네임 수정됨?
        assertThat(testUser.getNickname()).isEqualTo("newNickname");
        // DB save 메서드 1번만 호출?
        verify(userRepository, times(1)).save(any(User.class));
        // 비밀번호 인코더 호출 안됐는지
        verify(passwordEncoder, never()).encode(anyString());
        // 반환된 DTO의 닉네임 확인
        assertThat(result.getNickname()).isEqualTo("newNickname");
    }

    @Test
    @DisplayName("성공 : 비밀번호, 닉네임 모두 수정")
    void updateMyProfile_shouldUpdatePasswordAndNickname() {
        // Given
        UserProfileUpdateRequestDto request = new UserProfileUpdateRequestDto();
        request.setNickname("newNickname");
        request.setCurrentPassword(CURRENT_PASSWORD);
        request.setNewPassword(NEW_PASSWORD);

        // Mocking
        when(userRepository.findByUsername(USERNAME)).thenReturn(Optional.of(testUser));
        // 현재 비밀번호 맞는다고 가정
        when(passwordEncoder.matches(CURRENT_PASSWORD, HASHED_PASSWORD)).thenReturn(true);
        // 새 비밀번호 해싱
        when(passwordEncoder.encode(NEW_PASSWORD)).thenReturn("newHashedPassword");
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        // When
        userService.updateMyProfile(USERNAME, request);

        // Then
        // 해싱되었는가?
        assertThat(testUser.getPassword()).isEqualTo("newHashedPassword");
        // DB save?
        verify(userRepository, times(1)).save(any(User.class));
        // passwordEncoder 작동?
        verify(passwordEncoder, times(1)).matches(CURRENT_PASSWORD, HASHED_PASSWORD);
        verify(passwordEncoder, times(1)).encode(NEW_PASSWORD);
    }

    @Test
    @DisplayName("실패: 존재하지 않는 유저 수정 시 예외 발생")
    void updateMyProfile_shouldThrowException_whenUserNotFound() {
        // Given (준비)
        UserProfileUpdateRequestDto request = new UserProfileUpdateRequestDto();
        request.setNickname("newNickname");

        // DB 조회 시 Optional.empty() 반환 설정
        when(userRepository.findByUsername(USERNAME)).thenReturn(Optional.empty());

        // When & Then (실행 및 검증)
        // USER_NOT_FOUND 예외가 발생하는지 확인
        assertThrows(BaseException.class, () -> {
            userService.updateMyProfile(USERNAME, request);
        });
        // DB save는 호출되지 않았는지 확인
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    @DisplayName("실패: 비밀번호 변경 시 현재 비밀번호 불일치 예외 발생")
    void updateMyProfile_shouldThrowException_whenCurrentPasswordIncorrect() {
        // Given (준비)
        UserProfileUpdateRequestDto request = new UserProfileUpdateRequestDto();
        request.setCurrentPassword("wrongPassword");
        request.setNewPassword(NEW_PASSWORD);
        request.setNickname("newNickname");
        
        // Mocking: DB 조회
        when(userRepository.findByUsername(USERNAME)).thenReturn(Optional.of(testUser));
        // Mocking: 현재 비밀번호가 일치하지 않는다고 설정
        when(passwordEncoder.matches("wrongPassword", HASHED_PASSWORD)).thenReturn(false);

        // When & Then (실행 및 검증)
        // BadCredentialsException (또는 커스텀 예외)가 발생하는지 확인
        assertThrows(BadCredentialsException.class, () -> {
            userService.updateMyProfile(USERNAME, request);
        });
        // DB save는 호출되지 않았는지 확인
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    @DisplayName("실패: 닉네임 중복인 경우")
    void updateMyProfile_shouldThrowException_whenNicknameIsDuplicated() {
        // Given
        UserProfileUpdateRequestDto request = new UserProfileUpdateRequestDto();
        request.setNickname("existingNickname");

        // Mocking
        when(userRepository.findByUsername(USERNAME)).thenReturn(Optional.of(testUser));
        when(userRepository.existsByNickname("existingNickname")).thenReturn(true);
        
        // When & Then
        BaseException exception = assertThrows(BaseException.class, () -> {
            userService.updateMyProfile(USERNAME, request);
        });

        // 검증: 예상된 예외 타입(NICKNAME_DUPLICATED)이 발생했는지 확인
        assertThat(exception.getExceptionType()).isEqualTo(UserExceptionType.DUPLICATED_NICKNAME);
        // 검증: DB save 메서드는 호출되지 않았는지 확인
        verify(userRepository, never()).save(any(User.class));
        // 검증: 닉네임 중복 검사 메서드가 호출되었는지 확인
        verify(userRepository, times(1)).existsByNickname("existingNickname");
    }

    @Test
    @DisplayName("성공: 닉네임을 변경하지 않으면 중복검사도 스킵")
    void updateMyProfile_shouldSkipDuplicateCheck_whenNicknameIsUnchanged() {
        // Given
        UserProfileUpdateRequestDto request = new UserProfileUpdateRequestDto();
        request.setNickname("oldNickname");

        when(userRepository.findByUsername(USERNAME)).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        // when
        userService.updateMyProfile(USERNAME, request);

        // Then
        verify(userRepository, never()).existsByNickname(anyString());
        // DB save 1번만 호출
        verify(userRepository, times(1)).save(any(User.class));
    }

    @Test
    @DisplayName("성공: 프로필 이미지 수정 시 기존 이미지 삭제 및 새 이미지 URL 반영")
    void updateMyProfile_shouldUpdateProfileImage_andDeleteOldImage() {
        // Given
        testUser.setProfileImageUrl("https://pub-r2.com/profiles/old-image.jpg");
        UserProfileUpdateRequestDto request = new UserProfileUpdateRequestDto();
        request.setProfileImageUrl("https://pub-r2.com/profiles/new-image.jpg");

        when(userRepository.findByUsername(USERNAME)).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        // When
        UserProfileResponseDto result = userService.updateMyProfile(USERNAME, request);

        // Then
        assertThat(testUser.getProfileImageUrl()).isEqualTo("https://pub-r2.com/profiles/new-image.jpg");
        verify(imageUploadService, times(1)).deleteImage("https://pub-r2.com/profiles/old-image.jpg");
        verify(userRepository, times(1)).save(any(User.class));
        assertThat(result.getProfileImageUrl()).isEqualTo("https://pub-r2.com/profiles/new-image.jpg");
    }

    @Test
    @DisplayName("성공: resetProfileImage=true 시 기존 이미지 삭제 및 profileImageUrl null 처리")
    void updateMyProfile_shouldResetProfileImage_andDeleteOldImage() {
        // Given
        testUser.setProfileImageUrl("https://pub-r2.com/profiles/old-image.jpg");
        UserProfileUpdateRequestDto request = new UserProfileUpdateRequestDto();
        request.setResetProfileImage(true);

        when(userRepository.findByUsername(USERNAME)).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        // When
        UserProfileResponseDto result = userService.updateMyProfile(USERNAME, request);

        // Then
        assertThat(testUser.getProfileImageUrl()).isNull();
        verify(imageUploadService, times(1)).deleteImage("https://pub-r2.com/profiles/old-image.jpg");
        verify(userRepository, times(1)).save(any(User.class));
        assertThat(result.getProfileImageUrl()).isNull();
    }

    @Test
    @DisplayName("성공: 이메일 인증코드 발송 시 6자리 코드 생성 및 이전 실패 횟수 초기화")
    void sendVerificationCode_shouldGenerateSixDigitCodeAndResetAttempts() throws Exception {
        // Given
        EmailVerificationRequestDto request = new EmailVerificationRequestDto();
        request.setEmail("test@example.com");

        when(userRepository.findByUsername(USERNAME)).thenReturn(Optional.of(testUser));
        when(userRepository.existsByEmail("test@example.com")).thenReturn(false);

        // When
        userService.sendVerificationCode(USERNAME, request);

        // Then
        ArgumentCaptor<String> codeCaptor = ArgumentCaptor.forClass(String.class);
        verify(redisService).deleteData("EV_ATTEMPTS:test@example.com");
        verify(redisService).setData(eq("EV:test@example.com"), codeCaptor.capture(), eq(5L), eq(TimeUnit.MINUTES));
        verify(redisService).setData(eq("EMAIL_COOLDOWN:VERIFY:test@example.com"), eq("1"), eq(60L), eq(TimeUnit.SECONDS));
        assertThat(codeCaptor.getValue()).matches("^\\d{6}$");
        verify(emailService).sendVerificationEmail("test@example.com", codeCaptor.getValue());
    }

    @Test
    @DisplayName("실패: 이메일 인증코드 발송 쿨타임(60초) 이내 재요청 시 429 예외 발생 및 메일 미발송")
    void sendVerificationCode_shouldThrowException_whenCooldownActive() throws Exception {
        // Given
        EmailVerificationRequestDto request = new EmailVerificationRequestDto();
        request.setEmail("test@example.com");

        when(userRepository.findByUsername(USERNAME)).thenReturn(Optional.of(testUser));
        when(userRepository.existsByEmail("test@example.com")).thenReturn(false);
        when(redisService.getData("EMAIL_COOLDOWN:VERIFY:test@example.com")).thenReturn("1");

        // When & Then
        BaseException ex = assertThrows(BaseException.class,
                () -> userService.sendVerificationCode(USERNAME, request));

        assertThat(ex.getExceptionType()).isEqualTo(AuthExceptionType.EMAIL_SEND_TOO_FREQUENT);
        verify(emailService, never()).sendVerificationEmail(anyString(), anyString());
    }

    @Test
    @DisplayName("실패: 이메일 인증번호 5회 이상 오입력 시 인증코드 즉시 만료(브루트포스 방어)")
    void verifyAndRegisterEmail_shouldInvalidateCode_whenMaxAttemptsReached() {
        // Given
        EmailRegisterRequestDto request = new EmailRegisterRequestDto();
        request.setEmail("test@example.com");
        request.setCode("000000");

        when(userRepository.findByUsername(USERNAME)).thenReturn(Optional.of(testUser));
        when(redisService.getData("EV:test@example.com")).thenReturn("123456");
        when(redisService.incrementWithExpire("EV_ATTEMPTS:test@example.com", 5L, TimeUnit.MINUTES)).thenReturn(5L);

        // When & Then
        BaseException ex = assertThrows(BaseException.class,
                () -> userService.verifyAndRegisterEmail(USERNAME, request));

        assertThat(ex.getExceptionType()).isEqualTo(AuthExceptionType.INVALID_VERIFICATION_CODE);
        verify(redisService).deleteData("EV:test@example.com");
        verify(redisService).deleteData("EV_ATTEMPTS:test@example.com");
        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("성공: 이메일 인증 성공 시 인증코드 및 시도 횟수 키 모두 삭제")
    void verifyAndRegisterEmail_shouldSucceedAndCleanRedisKeys() {
        // Given
        EmailRegisterRequestDto request = new EmailRegisterRequestDto();
        request.setEmail("test@example.com");
        request.setCode("123456");

        when(userRepository.findByUsername(USERNAME)).thenReturn(Optional.of(testUser));
        when(redisService.getData("EV:test@example.com")).thenReturn("123456");
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        // When
        UserProfileResponseDto result = userService.verifyAndRegisterEmail(USERNAME, request);

        // Then
        assertThat(testUser.getEmail()).isEqualTo("test@example.com");
        assertThat(result.getEmail()).isEqualTo("test@example.com");
        verify(redisService).deleteData("EV:test@example.com");
        verify(redisService).deleteData("EV_ATTEMPTS:test@example.com");
    }
}
