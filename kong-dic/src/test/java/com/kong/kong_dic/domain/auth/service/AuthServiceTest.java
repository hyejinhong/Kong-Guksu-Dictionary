package com.kong.kong_dic.domain.auth.service;

import com.kong.kong_dic.common.exception.BaseException;
import com.kong.kong_dic.domain.auth.dto.PasswordResetRequestDto;
import com.kong.kong_dic.domain.auth.exception.AuthExceptionType;
import com.kong.kong_dic.domain.user.entity.Role;
import com.kong.kong_dic.domain.user.entity.User;
import com.kong.kong_dic.domain.user.repository.UserRepository;
import com.kong.kong_dic.global.config.CorsProperties;
import com.kong.kong_dic.global.jwt.JwtAuthenticationFilter;
import com.kong.kong_dic.global.jwt.JwtProvider;
import com.kong.kong_dic.global.service.EmailService;
import com.kong.kong_dic.global.service.RedisService;
import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

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
    @Mock
    private UserDetailsService userDetailsService;
    @Mock
    private FilterChain filterChain;

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

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
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

    @Test
    @DisplayName("정지된 계정(enabled=false)으로 토큰 갱신 요청 시 Redis에서 Refresh Token을 폐기하고 예외를 던진다")
    void refresh_DisabledUser_RevokesTokenAndThrowsException() {
        String refreshToken = "valid-refresh-token";
        User disabledUser = User.builder()
                .id(1L)
                .username("suspendedUser")
                .role(Role.USER)
                .enabled(false)
                .build();

        when(jwtProvider.validateToken(refreshToken)).thenReturn(true);
        when(jwtProvider.isRefreshToken(refreshToken)).thenReturn(true);
        when(refreshTokenService.getUsernameByRefreshToken(refreshToken)).thenReturn("suspendedUser");
        when(userRepository.findByUsername("suspendedUser")).thenReturn(Optional.of(disabledUser));

        assertThatThrownBy(() -> authService.refresh(refreshToken))
                .isInstanceOf(BaseException.class)
                .extracting("exceptionType")
                .isEqualTo(AuthExceptionType.INVALID_REFRESH_TOKEN);

        verify(refreshTokenService).deleteRefreshToken(refreshToken);
        verify(jwtProvider, never()).generateToken(any());
    }

    @Test
    @DisplayName("Access Token을 Refresh Token으로 사용하여 갱신 요청 시 예외를 던진다")
    void refresh_WithAccessToken_ThrowsException() {
        String accessToken = "access-token";
        when(jwtProvider.validateToken(accessToken)).thenReturn(true);
        when(jwtProvider.isRefreshToken(accessToken)).thenReturn(false);

        assertThatThrownBy(() -> authService.refresh(accessToken))
                .isInstanceOf(BaseException.class)
                .extracting("exceptionType")
                .isEqualTo(AuthExceptionType.INVALID_REFRESH_TOKEN);

        verify(refreshTokenService, never()).getUsernameByRefreshToken(any());
    }

    @Test
    @DisplayName("JwtAuthenticationFilter에서 Refresh Token을 Authorization 헤더로 전달하면 401을 반환한다")
    void jwtFilter_RejectsRefreshTokenUsedAsAccessToken() throws Exception {
        String refreshToken = "refresh-token";
        JwtAuthenticationFilter filter = new JwtAuthenticationFilter(jwtProvider, userDetailsService);

        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/users/me");
        request.addHeader("Authorization", "Bearer " + refreshToken);
        MockHttpServletResponse response = new MockHttpServletResponse();

        when(jwtProvider.resolveToken(request)).thenReturn(refreshToken);
        when(jwtProvider.validateToken(refreshToken)).thenReturn(true);
        when(jwtProvider.isAccessToken(refreshToken)).thenReturn(false);

        filter.doFilter(request, response, filterChain);

        assertThat(response.getStatus()).isEqualTo(401);
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        verify(filterChain, never()).doFilter(any(), any());
    }

    @Test
    @DisplayName("JwtAuthenticationFilter에서 정지된 계정(enabled=false)의 토큰 전달 시 401을 반환하고 인증을 차단한다")
    void jwtFilter_RejectsDisabledUser() throws Exception {
        String accessToken = "access-token";
        User disabledUser = User.builder()
                .id(1L)
                .username("suspendedUser")
                .role(Role.USER)
                .enabled(false)
                .build();

        JwtAuthenticationFilter filter = new JwtAuthenticationFilter(jwtProvider, userDetailsService);

        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/users/me");
        request.addHeader("Authorization", "Bearer " + accessToken);
        MockHttpServletResponse response = new MockHttpServletResponse();

        when(jwtProvider.resolveToken(request)).thenReturn(accessToken);
        when(jwtProvider.validateToken(accessToken)).thenReturn(true);
        when(jwtProvider.isAccessToken(accessToken)).thenReturn(true);
        when(jwtProvider.getUsernameFromToken(accessToken)).thenReturn("suspendedUser");
        when(userDetailsService.loadUserByUsername("suspendedUser")).thenReturn(disabledUser);

        filter.doFilter(request, response, filterChain);

        assertThat(response.getStatus()).isEqualTo(401);
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        verify(filterChain, never()).doFilter(any(), any());
    }
}
