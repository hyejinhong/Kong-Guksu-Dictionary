package com.kong.kong_dic.global.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.WebClient;

@Configuration
public class WebClientConfig {

    @Value("${kakao.map.api.key}")
    private String kakaoMapApiKey;

    @Bean(name = "kakaoMapWebClient")
    public WebClient kakaoMapWebClient() {
        return WebClient.builder()
                .baseUrl("https://dapi.kakao.com/v2/local/")
                .defaultHeader("Authorization", "KakaoAK " + kakaoMapApiKey)
                .build();
    }

}
