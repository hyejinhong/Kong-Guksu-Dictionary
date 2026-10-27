package com.kong.kong_dic.domain.follow.controller;

import com.kong.kong_dic.domain.auth.service.RefreshTokenService;
import com.kong.kong_dic.domain.follow.dto.FollowStatusResponseDto;
import com.kong.kong_dic.domain.follow.dto.FollowUserResponseDto;
import com.kong.kong_dic.domain.follow.service.FollowService;
import com.kong.kong_dic.domain.user.entity.SeasoningPreference;
import com.kong.kong_dic.domain.user.service.CustomUserDetailsService;
import com.kong.kong_dic.global.config.SecurityConfig;
import com.kong.kong_dic.global.jwt.JwtProvider;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.mapping.JpaMetamodelMappingContext;
import org.springframework.http.MediaType;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(FollowController.class)
@Import(SecurityConfig.class)
class FollowControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private JwtProvider jwtProvider;

    @MockitoBean
    private CustomUserDetailsService customUserDetailsService;

    @MockitoBean
    private AuthenticationConfiguration authenticationConfiguration;

    @MockitoBean
    private JpaMetamodelMappingContext jpaMetamodelMappingContext;

    @MockitoBean
    private RefreshTokenService refreshTokenService;

    @MockitoBean
    private FollowService followService;

    private static final String FOLLOWER_PUBLIC_ID = "11111111-1111-1111-1111-111111111111";
    private static final String TARGET_PUBLIC_ID = "22222222-2222-2222-2222-222222222222";

    @TestConfiguration
    static class TestConfig {
        @Bean
        public CorsConfigurationSource corsConfigurationSource() {
            return new UrlBasedCorsConfigurationSource();
        }
    }

    @Test
    @DisplayName("팔로우 토글 API 성공 테스트")
    @WithMockUser(username = "testUser", roles = "USER")
    void toggleFollow_shouldReturnFollowStatus() throws Exception {
        // Given
        FollowStatusResponseDto statusDto = FollowStatusResponseDto.builder()
                .isFollowing(true)
                .followerCount(10L)
                .followingCount(4L)
                .build();

        given(followService.toggleFollow("testUser", TARGET_PUBLIC_ID)).willReturn(statusDto);

        // When & Then
        mockMvc.perform(post("/users/" + TARGET_PUBLIC_ID + "/follow")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(0))
                .andExpect(jsonPath("$.data.isFollowing").value(true))
                .andExpect(jsonPath("$.data.followerCount").value(10))
                .andExpect(jsonPath("$.data.followingCount").value(4));
    }

    @Test
    @DisplayName("팔로워 목록 조회 API 성공 테스트")
    void getFollowers_shouldReturnPagedFollowers() throws Exception {
        // Given
        FollowUserResponseDto follower = FollowUserResponseDto.builder()
                .userId(FOLLOWER_PUBLIC_ID)
                .nickname("콩국수매니아")
                .avatarVariant("beam")
                .avatarSeed("seed1")
                .seasoningPreference(SeasoningPreference.SALT)
                .visitedCount(5L)
                .isFollowing(false)
                .followedAt(LocalDateTime.now())
                .build();

        Page<FollowUserResponseDto> page = new PageImpl<>(List.of(follower), PageRequest.of(0, 20), 1);
        given(followService.getFollowers(eq(TARGET_PUBLIC_ID), any(), any())).willReturn(page);

        // When & Then
        mockMvc.perform(get("/users/" + TARGET_PUBLIC_ID + "/followers")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(0))
                .andExpect(jsonPath("$.data.content[0].userId").value(FOLLOWER_PUBLIC_ID))
                .andExpect(jsonPath("$.data.content[0].nickname").value("콩국수매니아"))
                .andExpect(jsonPath("$.data.content[0].visitedCount").value(5));
    }
}
