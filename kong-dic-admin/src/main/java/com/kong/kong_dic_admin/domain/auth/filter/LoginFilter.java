package com.kong.kong_dic_admin.domain.auth.filter;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.kong.kong_dic.common.response.BaseResponse;
import com.kong.kong_dic_admin.domain.auth.dto.LoginResponseDto;
import com.kong.kong_dic_admin.domain.user.entity.Role;
import com.kong.kong_dic_admin.domain.user.entity.User;
import com.kong.kong_dic_admin.global.jwt.JwtProvider;
import com.kong.kong_dic_admin.global.security.SecurityAuditLogger;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import java.io.IOException;
import java.util.stream.Collectors;

public class LoginFilter extends UsernamePasswordAuthenticationFilter {

    private static final String ATTEMPTED_USERNAME_ATTR = "ATTEMPTED_USERNAME";

    private final AuthenticationManager authenticationManager;
    private final JwtProvider jwtProvider;
    private final ObjectMapper objectMapper = new ObjectMapper(); // JSON 파싱용

    public LoginFilter(AuthenticationManager authenticationManager, JwtProvider jwtProvider) {
        this.authenticationManager = authenticationManager;
        this.jwtProvider = jwtProvider;
        setFilterProcessesUrl("/login"); // "/login" 경로에서 동작하도록 설정
    }

    @Override
    public Authentication attemptAuthentication(HttpServletRequest request, HttpServletResponse response) throws AuthenticationException {
        try {
            String requestBody = request.getReader().lines().collect(Collectors.joining(System.lineSeparator()));
            JsonNode jsonNode = objectMapper.readTree(requestBody);

            if (jsonNode == null || !jsonNode.hasNonNull("username") || !jsonNode.hasNonNull("password")) {
                throw new BadCredentialsException("아이디와 비밀번호를 모두 입력해주세요.");
            }

            String username = jsonNode.get("username").asText();
            String password = jsonNode.get("password").asText();
            request.setAttribute(ATTEMPTED_USERNAME_ATTR, username);

            UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(username, password, null);
            return authenticationManager.authenticate(authToken);

        } catch (IOException e) {
            SecurityAuditLogger.logError("LOGIN_REQUEST_PARSE_ERROR", null, request, "Failed to parse admin login request body", e);
            throw new BadCredentialsException("로그인 요청을 처리하는 중 오류가 발생했습니다.", e);
        }
    }

    @Override
    protected void successfulAuthentication(HttpServletRequest request, HttpServletResponse response,
                                            FilterChain chain, Authentication authResult) throws IOException, ServletException {
        User user = (User) authResult.getPrincipal();

        if (user.getRole() != Role.ADMIN) {
            SecurityAuditLogger.logWarn("ADMIN_LOGIN_DENIED", user.getUsername(), request, "Non-admin user attempted admin login");
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            response.setContentType("application/json");
            response.setCharacterEncoding("UTF-8");
            response.getWriter().write(objectMapper.writeValueAsString(BaseResponse.error(403, "관리자 권한이 없는 계정입니다.")));
            response.getWriter().flush();
            return;
        }

        SecurityAuditLogger.logInfo("LOGIN_SUCCESS", user.getUsername(), request, "Admin logged in successfully");
        LoginResponseDto loginResponse = jwtProvider.generateToken(user);

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        response.getWriter().write(objectMapper.writeValueAsString(BaseResponse.success("Login Success.", loginResponse)));
        response.getWriter().flush();
    }

    @Override
    protected void unsuccessfulAuthentication(HttpServletRequest request, HttpServletResponse response,
                                              AuthenticationException failed) throws IOException, ServletException {
        Object attemptedUser = request.getAttribute(ATTEMPTED_USERNAME_ATTR);
        String username = attemptedUser != null ? attemptedUser.toString() : "unknown";
        SecurityAuditLogger.logWarn("LOGIN_FAILURE", username, request, failed.getMessage());

        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        response.getWriter().write(objectMapper.writeValueAsString(BaseResponse.error(1, "Invalid username or password.")));
        response.getWriter().flush();
    }
}
