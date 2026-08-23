package com.kong.kong_dic.global.jwt;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.kong.kong_dic.common.response.BaseResponse;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtProvider jwtProvider;
    private final UserDetailsService userDetailsService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            filterChain.doFilter(request, response);
            return;
        }

        try {
            String token = jwtProvider.resolveToken((HttpServletRequest) request);

            if (token != null && jwtProvider.validateToken(token)) {
                String username = jwtProvider.getUsernameFromToken(token);
                if (username != null) {
                    try {
                        UserDetails userDetails = userDetailsService.loadUserByUsername(username);
                        if (userDetails != null) {
                            SecurityContextHolder.getContext().setAuthentication(jwtProvider.getAuthentication(token));
                        }
                    } catch (Exception e) {
                        log.warn("Failed to load user details for username [{}]: {}", username, e.getMessage());
                    }
                }
            }

            filterChain.doFilter(request, response);
        } catch (ExpiredJwtException e) {
            handleException(response, "Session Expired, Please log in again.", HttpStatus.UNAUTHORIZED);
        } catch (JwtException | IllegalArgumentException e) {
            handleException(response, "Invalid token.", HttpStatus.UNAUTHORIZED);
        } catch (Exception e) {
            log.error("Authentication filter exception: ", e);
            handleException(response, "Authentication error.", HttpStatus.UNAUTHORIZED);
        }
    }

    private void handleException(HttpServletResponse response, String message, HttpStatus status) throws IOException {
        response.setStatus(status.value());
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        objectMapper.writeValue(response.getWriter(), BaseResponse.error(1, message));
    }
}
