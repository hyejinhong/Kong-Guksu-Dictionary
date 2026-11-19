package com.kong.kong_dic.global.jwt;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.kong.kong_dic.common.response.BaseResponse;
import com.kong.kong_dic.global.security.SecurityAuditLogger;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

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
                if (!jwtProvider.isAccessToken(token)) {
                    throw new JwtException("Refresh token cannot be used as access token.");
                }

                String username = jwtProvider.getUsernameFromToken(token);
                if (username != null) {
                    UserDetails userDetails = null;
                    try {
                        userDetails = userDetailsService.loadUserByUsername(username);
                    } catch (Exception e) {
                        SecurityAuditLogger.logWarn("USER_LOAD_FAILED", username, request, e.getMessage());
                    }

                    if (userDetails != null) {
                        if (!userDetails.isEnabled()) {
                            SecurityAuditLogger.logWarn("DISABLED_ACCOUNT_ACCESS", username, request, "Disabled account attempted API access");
                            handleException(response, "Account is disabled.", HttpStatus.UNAUTHORIZED);
                            return;
                        }
                        SecurityContextHolder.getContext().setAuthentication(jwtProvider.getAuthentication(userDetails));
                    }
                }
            }

            filterChain.doFilter(request, response);
        } catch (ExpiredJwtException e) {
            String expiredUser = e.getClaims() != null ? e.getClaims().getSubject() : null;
            SecurityAuditLogger.logWarn("TOKEN_EXPIRED", expiredUser, request, "Access token expired");
            handleException(response, "Session Expired, Please log in again.", HttpStatus.UNAUTHORIZED);
        } catch (JwtException | IllegalArgumentException e) {
            SecurityAuditLogger.logWarn("TOKEN_INVALID", null, request, e.getMessage());
            handleException(response, "Invalid token.", HttpStatus.UNAUTHORIZED);
        } catch (Exception e) {
            SecurityAuditLogger.logError("AUTH_FILTER_ERROR", null, request, e.getMessage(), e);
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
