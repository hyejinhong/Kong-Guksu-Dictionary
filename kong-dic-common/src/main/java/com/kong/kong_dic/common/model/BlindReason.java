package com.kong.kong_dic.common.model;

public enum BlindReason {
    IRRELEVANT("관련 없는 사진"),
    INAPPROPRIATE("부적절한 이미지"),
    SPAM("스팸 및 홍보"),
    COPYRIGHT("도용 및 저작권 침해"),
    ETC("기타");

    private final String description;

    BlindReason(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
