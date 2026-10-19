package com.kong.kong_dic.domain.user.controller;


import com.kong.kong_dic.domain.auth.service.RefreshTokenService;
import com.kong.kong_dic.domain.restaurant.dto.RestaurantCommentResponseDto;
import com.kong.kong_dic.domain.restaurant.service.RestaurantCommentService;
import com.kong.kong_dic.domain.restaurant.service.RestaurantSubmitService;
import com.kong.kong_dic.domain.user.dto.PublicUserProfileResponseDto;
import com.kong.kong_dic.domain.user.dto.UserRestaurantVisitResponseDto;
import com.kong.kong_dic.domain.user.entity.SeasoningPreference;
import com.kong.kong_dic.domain.user.service.CustomUserDetailsService;
import com.kong.kong_dic.domain.user.service.UserRestaurantVisitService;
import com.kong.kong_dic.domain.user.service.UserService;
import com.kong.kong_dic.global.config.SecurityConfig;
import com.kong.kong_dic.global.jwt.JwtProvider;
import org.springframework.web.cors.CorsConfigurationSource;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.context.TestConfiguration;
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

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(UserController.class)
@Import(SecurityConfig.class)
public class UserControllerTest {

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

    @TestConfiguration
    static class TestConfig {
        @org.springframework.context.annotation.Bean
        public CorsConfigurationSource corsConfigurationSource() {
            return new org.springframework.web.cors.UrlBasedCorsConfigurationSource();
        }
    }

    @MockitoBean
    private UserService userService;

    @MockitoBean
    private RestaurantCommentService restaurantCommentService;

    @MockitoBean
    private RestaurantSubmitService restaurantSubmitService;

    @MockitoBean
    private UserRestaurantVisitService userRestaurantVisitService;

    private static final String TARGET_PUBLIC_ID = "22222222-2222-2222-2222-222222222222";

    @Test
    @DisplayName("내가 쓴 댓글 모아보기 성공 테스트")
    @WithMockUser(username = "testUser", roles = "USER")
    void getMyComments_shouldReturnCommentPage_whenUserIsAuthenticated() throws Exception {
        // given
        RestaurantCommentResponseDto comment1 = RestaurantCommentResponseDto.builder()
                .id(1L)
                .nickname("testUser")
                .content("굿")
                .createdAt(LocalDateTime.now().minusDays(1))
                .build();

        RestaurantCommentResponseDto comment2 = RestaurantCommentResponseDto.builder()
                .id(2L)
                .nickname("testUser")
                .content("그냥 그래")
                .createdAt(LocalDateTime.now())
                .build();

        Page<RestaurantCommentResponseDto> responsePage = new PageImpl<>(
                List.of(comment1, comment2),
                PageRequest.of(0, 10),
                2
        );

        given(restaurantCommentService.getMyComments(any(), any())).willReturn((Page) responsePage);

        // when & then
        mockMvc.perform(get("/users/me/comments")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andDo(print());

        mockMvc.perform(get("/users/me/comments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .param("page", "0")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andDo(print())
                .andExpect(jsonPath("$.data.content[0].id").value(1L))
                .andExpect(jsonPath("$.data.content[0].nickname").value("testUser"))
                .andExpect(jsonPath("$.data.content[0].content").value("굿"))
                .andExpect(jsonPath("$.data.content[1].id").value(2L))
                .andExpect(jsonPath("$.data.content[1].content").value("그냥 그래"));
    }

    @Test
    @DisplayName("타 유저 프로필 요약 조회 성공 테스트 (publicId 기반)")
    @WithMockUser(username = "viewerUser", roles = "USER")
    void getUserProfile_shouldReturnPublicProfile() throws Exception {
        // given
        PublicUserProfileResponseDto profileDto = PublicUserProfileResponseDto.builder()
                .userId(TARGET_PUBLIC_ID)
                .nickname("콩국수박사")
                .avatarVariant("beam")
                .avatarSeed("seed2")
                .seasoningPreference(SeasoningPreference.SALT)
                .visitedCount(15L)
                .followerCount(8L)
                .followingCount(3L)
                .isFollowing(true)
                .isMe(false)
                .build();

        given(userService.getUserProfile(TARGET_PUBLIC_ID, "viewerUser")).willReturn(profileDto);

        // when & then
        mockMvc.perform(get("/users/" + TARGET_PUBLIC_ID + "/profile")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(0))
                .andExpect(jsonPath("$.data.userId").value(TARGET_PUBLIC_ID))
                .andExpect(jsonPath("$.data.nickname").value("콩국수박사"))
                .andExpect(jsonPath("$.data.visitedCount").value(15))
                .andExpect(jsonPath("$.data.followerCount").value(8))
                .andExpect(jsonPath("$.data.followingCount").value(3))
                .andExpect(jsonPath("$.data.isFollowing").value(true));
    }

    @Test
    @DisplayName("특정 유저의 방문 식당 기록(사전) 목록 조회 성공 테스트 (publicId 기반)")
    void getUserVisitedRestaurants_shouldReturnPagedVisits() throws Exception {
        // given
        UserRestaurantVisitResponseDto visitDto = UserRestaurantVisitResponseDto.builder()
                .id(10L)
                .visitedDate(LocalDate.of(2026, 8, 15))
                .rating(4.5)
                .memo("진한 국물이 일품!")
                .isImageBlinded(false)
                .build();

        Page<UserRestaurantVisitResponseDto> page = new PageImpl<>(
                List.of(visitDto),
                PageRequest.of(0, 10),
                1
        );

        given(userRestaurantVisitService.getVisitedRestaurantsByUserId(eq(TARGET_PUBLIC_ID), any())).willReturn(page);

        // when & then
        mockMvc.perform(get("/users/" + TARGET_PUBLIC_ID + "/visited-restaurants")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(0))
                .andExpect(jsonPath("$.data.content[0].id").value(10L))
                .andExpect(jsonPath("$.data.content[0].rating").value(4.5))
                .andExpect(jsonPath("$.data.content[0].memo").value("진한 국물이 일품!"));
    }
}
