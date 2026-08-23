package com.kong.kong_dic.global.config;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.ArrayList;
import java.util.List;

@Configuration
@RequiredArgsConstructor
public class CorsConfig {

    private final CorsProperties corsProperties;

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        List<String> allowedOrigins = new ArrayList<>();
        if (corsProperties.getUrls() != null && !corsProperties.getUrls().isEmpty()) {
            allowedOrigins.addAll(corsProperties.getUrls());
        }

        // 우리 서비스의 실제 프론트엔드 도메인 (로컬 및 배포)
        List<String> requiredFrontends = List.of(
                "http://localhost:3000",
                "http://localhost:3001",
                "https://kong-guksu-dictionary.vercel.app",
                "https://kong-dic-admin.vercel.app"
        );
        for (String origin : requiredFrontends) {
            if (!allowedOrigins.contains(origin)) {
                allowedOrigins.add(origin);
            }
        }

        configuration.setAllowedOrigins(allowedOrigins);
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowCredentials(true);
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setExposedHeaders(List.of("Authorization", "Refresh-Token", "Set-Cookie", "Content-Disposition"));
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);

        return source;
    }
}
