package com.kong.kong_dic.global.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Setter
@Getter
@Component
@ConfigurationProperties(prefix = "front")
public class CorsProperties {
    private static final String FALLBACK_LOCAL_ORIGIN = "http://localhost:3000";

    private List<String> urls = new ArrayList<>(); // 'front.urls' 리스트와 매핑

    public List<String> getAllowedOrigins() {
        List<String> allowedOrigins = new ArrayList<>();
        if (urls != null) {
            for (String url : urls) {
                if (url != null && !url.isBlank()) {
                    String normalized = normalizeOrigin(url);
                    if (!allowedOrigins.contains(normalized)) {
                        allowedOrigins.add(normalized);
                    }
                }
            }
        }
        return allowedOrigins;
    }

    public String resolveAllowedOrigin(String origin) {
        List<String> allowedOrigins = getAllowedOrigins();
        if (origin != null && !origin.isBlank()) {
            String normalized = normalizeOrigin(origin);
            if (allowedOrigins.contains(normalized)) {
                return normalized;
            }
        }
        if (!allowedOrigins.isEmpty()) {
            return allowedOrigins.get(0);
        }
        return FALLBACK_LOCAL_ORIGIN;
    }

    private String normalizeOrigin(String origin) {
        String trimmed = origin.trim();
        while (trimmed.endsWith("/")) {
            trimmed = trimmed.substring(0, trimmed.length() - 1);
        }
        return trimmed;
    }
}
