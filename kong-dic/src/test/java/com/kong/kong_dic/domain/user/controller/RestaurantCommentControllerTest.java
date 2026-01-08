package com.kong.kong_dic.domain.user.controller;

import com.kong.kong_dic.common.exception.BaseException;
import com.kong.kong_dic.domain.restaurant.controller.RestaurantCommentController;
import com.kong.kong_dic.domain.restaurant.exception.RestaurantExceptionType;
import com.kong.kong_dic.domain.restaurant.service.RestaurantCommentService;
import com.kong.kong_dic.domain.user.service.CustomUserDetailsService;
import com.kong.kong_dic.global.config.SecurityConfig;
import com.kong.kong_dic.global.jwt.JwtProvider;
import com.kong.kong_dic.global.resolver.AuthUserArgumentResolver;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Import;
import org.springframework.data.jpa.mapping.JpaMetamodelMappingContext;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;


import java.util.List;

import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;

@WebMvcTest(RestaurantCommentController.class)
@Import({SecurityConfig.class})
public class RestaurantCommentControllerTest {

    @Autowired
    private MockMvc mockMvc;

    // --- SecurityConfig 의존성 Mocking ---
    @MockitoBean
    private JwtProvider jwtProvider;
    @MockitoBean private CustomUserDetailsService customUserDetailsService;
    @MockitoBean private AuthenticationConfiguration authenticationConfiguration;
    @MockitoBean private JpaMetamodelMappingContext jpaMetamodelMappingContext;

    @TestConfiguration
    static class TestConfig implements WebMvcConfigurer {
        @Override
        public void addArgumentResolvers(List<HandlerMethodArgumentResolver> resolvers) {
            resolvers.add(new AuthUserArgumentResolver());
        }
    }


    // --- 비즈니스 로직 Mocking ---
    @MockitoBean private RestaurantCommentService restaurantCommentService;

    @Test
    @DisplayName("댓글 삭제 성공 시 204 No Content를 반환한다")
    void deleteComment_shouldReturnNoContent_whenUserIsOwner() throws Exception {
        // given
        Long restaurantId = 1L;
        Long commentId = 5L;

        // 서비스의 deleteMyComment가 호출되면 아무 일도 일어나지 않음 (성공 가정)
        doNothing().when(restaurantCommentService).deleteMyComment(anyLong(), anyString());

        // when & then
        mockMvc.perform(delete("/restaurants/{restaurantId}/comments/{commentId}", restaurantId, commentId)
                        .with(csrf()) // CSRF 토큰 주입
                        .with(user("testUser").roles("USER"))) // 확실한 사용자 인증 정보 주입
                .andExpect(status().isOk()) // 204 확인
                .andDo(print());

        // 서비스 메서드가 올바른 파라미터로 호출되었는지 검증
        verify(restaurantCommentService).deleteMyComment(commentId, "testUser");

    }

    @Test
    @DisplayName("로그인하지 않은 사용자가 삭제 요청 시 401 Unauthorized를 반환한다")
    void deleteComment_shouldReturnUnauthorized_whenUserIsAnonymous() throws Exception {
        // given
        Long restaurantId = 1L;
        Long commentId = 5L;

        // when & then
        mockMvc.perform(delete("/restaurants/{restaurantId}/comments/{commentId}", restaurantId, commentId)
                        .with(csrf()))
                .andExpect(status().isUnauthorized())
                .andDo(print());
    }

    @Test
    @DisplayName("존재하지 않는 댓글 삭제 요청시 404")
    void deleteComment_shouldReturnNotFound_whenCommentDoesNotExist() throws Exception {
        // given
        Long restaurantId = 1L;
        Long nonExistentCommentId = 999L;

        doThrow(new BaseException(RestaurantExceptionType.COMMENT_NOT_FOUND))
                .when(restaurantCommentService).deleteMyComment(anyLong(), anyString());

        mockMvc.perform(delete("/restaurants/{restaurantId}/comments/{commentId}", restaurantId, nonExistentCommentId)
                .with(csrf())
                .with(user("testUser").roles("USER")))
                .andExpect(status().isNotFound())
                .andDo(print());
    }

}
