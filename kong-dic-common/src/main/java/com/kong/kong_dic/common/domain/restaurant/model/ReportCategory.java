package com.kong.kong_dic.common.domain.restaurant.model;

import lombok.Getter;

@Getter
public enum ReportCategory {
    PRICE_BEAN("콩 종류 / 가격 변경"),
    LOCATION("주소 / 위치 오류"),
    CLOSED("폐업 / 영업 중단"),
    OTHER("기타");

    private final String description;

    ReportCategory(String description) {
        this.description = description;
    }
}
