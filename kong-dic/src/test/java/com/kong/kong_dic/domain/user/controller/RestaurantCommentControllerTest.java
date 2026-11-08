package com.kong.kong_dic.domain.user.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.kong.kong_dic.common.exception.BaseException;
import com.kong.kong_dic.domain.restaurant.controller.RestaurantCommentController;
import com.kong.kong_dic.domain.restaurant.dto.RestaurantCommentRequestDto;
import com.kong.kong_dic.domain.restaurant.dto.RestaurantCommentResponseDto;
import com.kong.kong_dic.domain.restaurant.exception.RestaurantExceptionType;
import com.kong.kong_dic.domain.restaurant.service.RestaurantCommentService;
import com.kong.kong_dic.domain.user.service.CustomUserDetailsService;
import com.kong.kong_dic.domain.auth.service.RefreshTokenService;
import com.kong.kong_dic.global.config.SecurityConfig;
import com.kong.kong_dic.global.jwt.JwtProvider;
import com.kong.kong_dic.global.resolver.AuthUserArgumentResolver;
import org.springframework.web.cors.CorsConfigurationSource;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.data.jpa.mapping.JpaMetamodelMappingContext;
import org.springframework.http.MediaType;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;

@WebMvcTest(RestaurantCommentController.class)
@Import({SecurityConfig.class})
public class RestaurantCommentControllerTest {

    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private ObjectMapper objectMapper;

    // --- SecurityConfig 의존성 Mocking ---
    @MockitoBean
    private JwtProvider jwtProvider;
    @MockitoBean private CustomUserDetailsService customUserDetailsService;
    @MockitoBean private AuthenticationConfiguration authenticationConfiguration;
    @MockitoBean private JpaMetamodelMappingContext jpaMetamodelMappingContext;
    @MockitoBean private RefreshTokenService refreshTokenService;

    @TestConfiguration
    static class TestConfig implements WebMvcConfigurer {
        @Override
        public void addArgumentResolvers(List<HandlerMethodArgumentResolver> resolvers) {
            resolvers.add(new AuthUserArgumentResolver());
        }

        @Bean
        public CorsConfigurationSource corsConfigurationSource() {
            return new UrlBasedCorsConfigurationSource();
        }
    }

    // --- 비즈니스 로직 Mocking ---
    @MockitoBean private RestaurantCommentService restaurantCommentService;

    @Test
    @DisplayName("댓글 작성 성공 시 200 OK를 반환한다")
    void addComment_shouldReturnOk_whenUserIsAuthenticated() throws Exception {
        Long restaurantId = 1L;
        RestaurantCommentRequestDto requestDto = new RestaurantCommentRequestDto();
        requestDto.setContent("ㅇㅅㅇ");

        RestaurantCommentResponseDto responseDto = RestaurantCommentResponseDto.builder()
                .id(1L)
                .nickname("testUser")
                .content("ㅇㅅㅇ")
                .createdAt(LocalDateTime.now())
                .build();

        given(restaurantCommentService.addComment(anyLong(), any(RestaurantCommentRequestDto.class), any()))
                .willReturn(responseDto);

        mockMvc.perform(post("/restaurants/{restaurantId}/comments", restaurantId)
                        .with(csrf())
                        .with(user("testUser").roles("USER"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestDto)))
                .andExpect(status().isOk())
                .andDo(print());

        verify(restaurantCommentService).addComment(eq(restaurantId), any(RestaurantCommentRequestDto.class), eq("testUser"));
    }

    @Test
    @DisplayName("댓글 삭제 성공 시 200 OK를 반환한다")
    void deleteComment_shouldReturnNoContent_whenUserIsOwner() throws Exception {
        Long restaurantId = 1L;
        Long commentId = 5L;

        doNothing().when(restaurantCommentService).deleteMyComment(anyLong(), anyLong(), anyString());

        mockMvc.perform(delete("/restaurants/{restaurantId}/comments/{commentId}", restaurantId, commentId)
                        .with(csrf())
                        .with(user("testUser").roles("USER")))
                .andExpect(status().isOk())
                .andDo(print());

        verify(restaurantCommentService).deleteMyComment(restaurantId, commentId, "testUser");
    }

    @Test
    @DisplayName("로그인하지 않은 사용자가 삭제 요청 시 401 Unauthorized를 반환한다")
    void deleteComment_shouldReturnUnauthorized_whenUserIsAnonymous() throws Exception {
        Long restaurantId = 1L;
        Long commentId = 5L;

        mockMvc.perform(delete("/restaurants/{restaurantId}/comments/{commentId}", restaurantId, commentId)
                        .with(csrf()))
                .andExpect(status().isUnauthorized())
                .andDo(print());
    }

    @Test
    @DisplayName("존재하지 않는 댓글 또는 다른 식당의 댓글 삭제 요청시 404")
    void deleteComment_shouldReturnNotFound_whenCommentDoesNotExist() throws Exception {
        Long restaurantId = 1L;
        Long nonExistentCommentId = 999L;

        doThrow(new BaseException(RestaurantExceptionType.COMMENT_NOT_FOUND))
                .when(restaurantCommentService).deleteMyComment(anyLong(), anyLong(), anyString());

        mockMvc.perform(delete("/restaurants/{restaurantId}/comments/{commentId}", restaurantId, nonExistentCommentId)
                .with(csrf())
                .with(user("testUser").roles("USER")))
                .andExpect(status().isNotFound())
                .andDo(print());
    }
}
