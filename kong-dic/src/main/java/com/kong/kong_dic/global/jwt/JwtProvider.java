package com.kong.kong_dic.global.jwt;

import com.kong.kong_dic.domain.auth.dto.LoginResponseDto;
import com.kong.kong_dic.domain.user.entity.User;
import com.kong.kong_dic.domain.user.service.CustomUserDetailsService;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Date;

@Component
@RequiredArgsConstructor
public class JwtProvider {

    public static final String TOKEN_TYPE_CLAIM = "type";
    public static final String TOKEN_TYPE_ACCESS = "access";
    public static final String TOKEN_TYPE_REFRESH = "refresh";

    @Value("${jwt.secret}")
    private String secretKey;

    @Value("${jwt.expiration}")
    private long expirationTime;

    @Value("${jwt.refresh-expiration}")
    private long refreshExpirationTime;

    private final CustomUserDetailsService userDetailsService;

    private Key getSigningKey() {
        byte[] keyBytes = secretKey.getBytes(StandardCharsets.UTF_8);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    public LoginResponseDto generateToken(User user) {
        String accessToken = createAccessToken(user);
        String refreshToken = createRefreshToken(user);

        return LoginResponseDto.builder()
                .token(accessToken)
                .refreshToken(refreshToken)
                .exp(new Date(System.currentTimeMillis() + expirationTime))
                .build();
    }

    public String createAccessToken(User user) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + expirationTime);

        return Jwts.builder()
                .setSubject(user.getUsername())
                .claim("role", user.getRole())
                .claim(TOKEN_TYPE_CLAIM, TOKEN_TYPE_ACCESS)
                .setIssuedAt(now)
                .setExpiration(expiryDate)
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    public String createRefreshToken(User user) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + refreshExpirationTime);

        return Jwts.builder()
                .setSubject(user.getUsername())
                .claim(TOKEN_TYPE_CLAIM, TOKEN_TYPE_REFRESH)
                .setIssuedAt(now)
                .setExpiration(expiryDate)
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    public Claims getClaimsFromToken(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    public boolean validateToken(String token) {
        Jwts.parserBuilder().setSigningKey(getSigningKey()).build().parseClaimsJws(token);
        return true;
    }

    public boolean isAccessToken(String token) {
        Claims claims = getClaimsFromToken(token);
        String type = claims.get(TOKEN_TYPE_CLAIM, String.class);
        if (TOKEN_TYPE_REFRESH.equals(type)) {
            return false;
        }
        return TOKEN_TYPE_ACCESS.equals(type) || (type == null && claims.get("role") != null);
    }

    public boolean isRefreshToken(String token) {
        Claims claims = getClaimsFromToken(token);
        String type = claims.get(TOKEN_TYPE_CLAIM, String.class);
        if (TOKEN_TYPE_ACCESS.equals(type)) {
            return false;
        }
        return TOKEN_TYPE_REFRESH.equals(type) || (type == null && claims.get("role") == null);
    }

    public String getUsernameFromToken(String token) {
        return getClaimsFromToken(token).getSubject();
    }

    /**
     * ✅ HTTP 요청에서 JWT 토큰 추출
     */
    public String resolveToken(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7); // "Bearer " 부분 제거
        }
        return null;
    }

    /**
     * ✅ JWT 토큰에서 인증 정보 가져오기 (DB UserDetails 권한 기반 표준화)
     */
    public Authentication getAuthentication(String token) {
        String username = getUsernameFromToken(token);
        UserDetails userDetails = userDetailsService.loadUserByUsername(username);
        return getAuthentication(userDetails);
    }

    public Authentication getAuthentication(UserDetails userDetails) {
        Collection<GrantedAuthority> authorities = new ArrayList<>();
        if (userDetails != null && userDetails.getAuthorities() != null) {
            for (GrantedAuthority authority : userDetails.getAuthorities()) {
                String auth = authority.getAuthority();
                if (auth != null && !auth.isBlank()) {
                    authorities.add(new SimpleGrantedAuthority(auth));
                    if (!auth.startsWith("ROLE_")) {
                        authorities.add(new SimpleGrantedAuthority("ROLE_" + auth));
                    }
                }
            }
        }

        return new UsernamePasswordAuthenticationToken(userDetails, "", authorities);
    }
}
