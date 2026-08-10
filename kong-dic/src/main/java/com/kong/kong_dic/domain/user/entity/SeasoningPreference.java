package com.kong.kong_dic.domain.user.entity;

import lombok.Getter;

@Getter
public enum SeasoningPreference {
    SALT("소금"),
    SUGAR("설탕"),
    BOTH("단짠"),
    NONE("순정");

    private final String description;

    SeasoningPreference(String description) {
        this.description = description;
    }
}
