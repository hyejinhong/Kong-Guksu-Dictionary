package com.kong.kong_dic.global.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;
import java.util.List;

@Data
public class KakaoMapResponse {
    private List<Document> documents;
    private Meta meta;

    @Data
    public static class Document {
        private String address_name;
        private String address_type;
        private RoadAddress road_address;
        private Address address;
        private String x;
        private String y;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class RoadAddress {
        private String address_name;
        private String x;
        private String y;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Address {
        private String address_name;
        private String x;
        private String y;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Meta {
        private int total_count;
        private int pageable_count;
        private boolean is_end;
    }
}
