package com.kong.kong_dic.global.util;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.kong.kong_dic.global.model.Coordinates;
import com.kong.kong_dic.global.model.KakaoMapResponse;
import lombok.AllArgsConstructor;
import lombok.Getter;
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
     * 주소 To 좌표
     * @param address
     * @return String {latitude#longitude}
     */
    public Coordinates addressToCoordinates(String address) {
        log.info("### searchByAddress : {}", address);

        String result = webClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path("search/address.json")
                        .queryParam("query", address)
                        .build())
                .retrieve()
                .bodyToMono(String.class)
                .block();

        log.info("### KakaoMap API result : {}", result);

        try {
            ObjectMapper objectMapper = new ObjectMapper();
            KakaoMapResponse response = objectMapper.readValue(result, KakaoMapResponse.class);

            if (response.getDocuments() != null && !response.getDocuments().isEmpty()) {
                KakaoMapResponse.Document doc = response.getDocuments().get(0);
                double lat = Double.parseDouble(doc.getY());
                double lon = Double.parseDouble(doc.getX());
                return new Coordinates(lat, lon);
            } else {
                log.warn("### No coordinates found for address: {}", address);
                return null;
            }
        } catch (Exception e) {
            log.error("### Error parsing KakaoMap API response", e);
            return null;
        }
    }
}
