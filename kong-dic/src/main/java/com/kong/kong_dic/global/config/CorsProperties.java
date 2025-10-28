package com.kong.kong_dic.global.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.util.List;

@Setter
@Getter
@Component
@ConfigurationProperties(prefix = "front")
public class CorsProperties {
    private List<String> urls; // 'front.urls' 리스트와 매핑
}