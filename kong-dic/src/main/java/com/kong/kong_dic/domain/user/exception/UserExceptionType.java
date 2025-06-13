package com.kong.kong_dic.domain.user.exception;

import com.kong.kong_dic.global.exception.BaseExceptionType;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum UserExceptionType implements BaseExceptionType {

    ALREADY_VISITED_RESTAURANT(1, 400, "이미 저장된 정보입니다.");

    private final int code;
    private final int httpStatusCode;
    private final String message;
}
