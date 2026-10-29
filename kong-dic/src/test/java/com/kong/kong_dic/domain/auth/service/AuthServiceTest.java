package com.kong.kong_dic.domain.auth.service;

import com.kong.kong_dic.domain.auth.dto.PasswordResetRequestDto;
import com.kong.kong_dic.domain.user.entity.Role;
import com.kong.kong_dic.domain.user.entity.User;
import com.kong.kong_dic.domain.user.repository.UserRepository;
import com.kong.kong_dic.global.config.CorsProperties;
import com.kong.kong_dic.global.jwt.JwtProvider;
import com.kong.kong_dic.global.service.EmailService;
import com.kong.kong_dic.global.service.RedisService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private AuthenticationManager authenticationManager;
    @Mock
    private UserRepository userRepository;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private JwtProvider jwtProvider;
    @Mock
    private RefreshTokenService refreshTokenService;
    @Mock
    private RedisService redisService;
    @Mock
    private EmailService emailService;

    private CorsProperties corsProperties;
    private AuthService authService;

    @BeforeEach
    void setUp() {
        corsProperties = new CorsProperties();
        corsProperties.setUrls(List.of(
                "https://kong-guksu-dictionary.vercel.app",
                "http://localhost:3000"
        ));
        authService = new AuthService(
                authenticationManager,
                userRepository,
                passwordEncoder,
                jwtProvider,
                refreshTokenService,
                redisService,
                emailService,
                corsProperties
        );
    }

    @Test
    @DisplayName("비밀번호 재설정 요청 시 허용되지 않은 Origin 헤더가 전달되면 설정된 첫 번째 허용 URL로 고정한다")
    void requestPasswordReset_RejectsMaliciousOrigin() throws Exception {
        User user = User.builder()
                .id(1L)
                .username("testuser")
                .email("test@example.com")
                .role(Role.USER)
                .enabled(true)
                .build();
        when(userRepository.findByUsernameIgnoreCaseAndEmail("testuser", "test@example.com"))
                .thenReturn(Optional.of(user));

        PasswordResetRequestDto requestDto = new PasswordResetRequestDto();
        requestDto.setUsername("testuser");
        requestDto.setEmail("test@example.com");

        authService.requestPasswordReset(requestDto, "https://evil-attacker.com");

        ArgumentCaptor<String> linkCaptor = ArgumentCaptor.forClass(String.class);
        verify(emailService).sendPasswordResetEmail(eq("test@example.com"), linkCaptor.capture());

        String resetLink = linkCaptor.getValue();
        assertThat(resetLink).startsWith("https://kong-guksu-dictionary.vercel.app/reset-password?token=");
        assertThat(resetLink).doesNotContain("evil-attacker.com");
    }

    @Test
    @DisplayName("비밀번호 재설정 요청 시 허용된 Origin 헤더가 전달되면 해당 Origin으로 링크를 생성한다")
    void requestPasswordReset_AllowsWhitelistedOrigin() throws Exception {
        User user = User.builder()
                .id(1L)
                .username("testuser")
                .email("test@example.com")
                .role(Role.USER)
                .enabled(true)
                .build();
        when(userRepository.findByUsernameIgnoreCaseAndEmail("testuser", "test@example.com"))
                .thenReturn(Optional.of(user));

        PasswordResetRequestDto requestDto = new PasswordResetRequestDto();
        requestDto.setUsername("testuser");
        requestDto.setEmail("test@example.com");

        authService.requestPasswordReset(requestDto, "http://localhost:3000/");

        ArgumentCaptor<String> linkCaptor = ArgumentCaptor.forClass(String.class);
        verify(emailService).sendPasswordResetEmail(eq("test@example.com"), linkCaptor.capture());

        String resetLink = linkCaptor.getValue();
        assertThat(resetLink).startsWith("http://localhost:3000/reset-password?token=");
    }
}
