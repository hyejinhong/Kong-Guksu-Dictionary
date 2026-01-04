package com.kong.kong_dic.domain.user.controller;


import com.kong.kong_dic.domain.restaurant.dto.RestaurantCommentResponseDto;
import com.kong.kong_dic.domain.restaurant.service.RestaurantCommentService;
import com.kong.kong_dic.domain.user.service.CustomUserDetailsService;
import com.kong.kong_dic.domain.user.service.UserService;
import com.kong.kong_dic.global.config.SecurityConfig;
import com.kong.kong_dic.global.jwt.JwtProvider;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
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

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
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
    private UserService userService;

    @MockitoBean
    private RestaurantCommentService restaurantCommentService; // 댓글 조회 로직 검증용 Mock

    @Test
    @DisplayName("내가 쓴 댓글 모아보기 성공 테스트")
    @WithMockUser(username = "testUser", roles = "USER") // 가짜 인증 사용자 주입
    void getMyComments_shouldReturnCommentPage_whenUserIsAuthenticated() throws Exception {
        // given
        // 1. DTO 객체 생성 (보내주신 필드 구조에 맞춤: id, nickname, content, createdAt)
        RestaurantCommentResponseDto comment1 = RestaurantCommentResponseDto.builder()
                .id(1L)
                .nickname("testUser") // 작성자 닉네임
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
                .andDo(print()); // 요청/응답 로그 출력

        // when & then
        mockMvc.perform(get("/users/me/comments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .param("page", "0")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andDo(print())
                // JSON 검증 (필드명 정확히 매칭)
                .andExpect(jsonPath("$.content[0].id").value(1L))
                .andExpect(jsonPath("$.content[0].nickname").value("testUser"))
                .andExpect(jsonPath("$.content[0].content").value("굿"))
                .andExpect(jsonPath("$.content[1].id").value(2L))
                .andExpect(jsonPath("$.content[1].content").value("그냥 그래"));

    }
}