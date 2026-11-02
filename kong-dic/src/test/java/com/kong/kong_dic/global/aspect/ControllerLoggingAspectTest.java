package com.kong.kong_dic.global.aspect;

import com.kong.kong_dic.domain.auth.dto.LoginRequestDto;
import com.kong.kong_dic.domain.auth.dto.PasswordResetConfirmDto;
import com.kong.kong_dic.domain.auth.dto.RefreshRequestDto;
import com.kong.kong_dic.domain.auth.dto.SignupRequestDto;
import com.kong.kong_dic.domain.user.dto.EmailRegisterRequestDto;
import com.kong.kong_dic.domain.user.dto.UserProfileUpdateRequestDto;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class ControllerLoggingAspectTest {

    private final ControllerLoggingAspect aspect = new ControllerLoggingAspect();

    @Test
    @DisplayName("성공: 인증/회원가입 DTO의 비밀번호 및 토큰 필드는 로그 문자열에서 제외됨")
    void dtoToString_shouldExcludeSensitiveFields() {
        SignupRequestDto signup = new SignupRequestDto();
        signup.setUsername("user1");
        signup.setPassword("secretPass123!");
        signup.setNickname("콩국수");

        PasswordResetConfirmDto reset = new PasswordResetConfirmDto();
        reset.setToken("reset-secret-token");
        reset.setNewPassword("newSecretPass!");

        RefreshRequestDto refresh = new RefreshRequestDto();
        refresh.setRefreshToken("eyJhbGciOiJIUzI1NiJ9.secret");

        LoginRequestDto login = new LoginRequestDto();
        login.setUsername("user1");
        login.setPassword("loginSecret");

        UserProfileUpdateRequestDto profileUpdate = new UserProfileUpdateRequestDto();
        profileUpdate.setNickname("새닉네임");
        profileUpdate.setCurrentPassword("oldPass");
        profileUpdate.setNewPassword("newPass");

        EmailRegisterRequestDto emailReg = new EmailRegisterRequestDto();
        emailReg.setEmail("user@test.com");
        emailReg.setCode("654321");

        assertThat(aspect.formatArgSafely(signup))
                .contains("username=user1")
                .doesNotContain("secretPass123!");
        assertThat(aspect.formatArgSafely(reset))
                .doesNotContain("reset-secret-token")
                .doesNotContain("newSecretPass!");
        assertThat(aspect.formatArgSafely(refresh))
                .doesNotContain("eyJhbGciOiJIUzI1NiJ9.secret");
        assertThat(aspect.formatArgSafely(login))
                .contains("username=user1")
                .doesNotContain("loginSecret");
        assertThat(aspect.formatArgSafely(profileUpdate))
                .contains("nickname=새닉네임")
                .doesNotContain("oldPass")
                .doesNotContain("newPass");
        assertThat(aspect.formatArgSafely(emailReg))
                .contains("email=user@test.com")
                .doesNotContain("654321");
    }

    @Test
    @DisplayName("성공: 임의 문자열 내 password, token 등 민감 키-값 패턴이 정규식으로 마스킹됨")
    void maskSensitiveFields_shouldMaskRegexPatterns() {
        String raw = "CustomDto(username=tester, password=mySecretPassword, refreshToken=jwt-token-val)";
        String masked = ControllerLoggingAspect.maskSensitiveFields(raw);

        assertThat(masked)
                .contains("username=tester")
                .contains("password=****")
                .contains("refreshToken=****")
                .doesNotContain("mySecretPassword")
                .doesNotContain("jwt-token-val");
    }
}
