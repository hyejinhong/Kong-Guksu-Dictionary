package com.kong.kong_dic.global.util;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

@Slf4j
@Component
public class KakaoMapUtil {

    private final WebClient webClient;

    @Autowired
    public KakaoMapUtil(@Qualifier("kakaoMapWebClient") WebClient kakaoMapWebClient) {
        this.webClient = kakaoMapWebClient;
    }

    /**
     * 키워드 To 장소검색
     * @param address
     * @return String {latitude#longitude}
     */
    public String searchByAddress(String address) {

        log.info("### searchByAddress : {}", address);

        String result = webClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path("search/address.json")
                        .queryParam("query", address)
                        .queryParam("category_group_code", "FD6")
                        .build())
                .retrieve()
                .bodyToMono(String.class)
                .block();

        log.info("### searchByKeyword result : {}", result);

        return result;
    }
}
