package com.kong.kong_dic.domain.bean;

public enum BeanType {
    OTHER_BEAN("Other Bean"),
    SOY_BEAN("Soy Bean"),
    BLACK_BEAN("Black Bean");

    private final String name;

    BeanType(String name) {
        this.name = name;
    }

    public String getName() {
        return name;
    }
}
