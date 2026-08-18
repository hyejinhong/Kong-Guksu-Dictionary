package com.kong.kong_dic_admin.global.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.ArrayList;
import java.util.List;

@Configuration
public class CorsConfig {

    @Value("${front.url:http://localhost:3001}")
    private String frontUrl;

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        List<String> allowedOrigins = new ArrayList<>();
        if (frontUrl != null && !frontUrl.isBlank()) {
            allowedOrigins.add(frontUrl);
        }
        // 로컬 및 배포 어드민 프론트엔드
        if (!allowedOrigins.contains("http://localhost:3001")) {
            allowedOrigins.add("http://localhost:3001");
        }
        if (!allowedOrigins.contains("https://kong-dic-admin.vercel.app")) {
            allowedOrigins.add("https://kong-dic-admin.vercel.app");
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
