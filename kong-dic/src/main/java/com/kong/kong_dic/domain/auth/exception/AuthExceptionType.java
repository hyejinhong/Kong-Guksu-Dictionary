package com.kong.kong_dic.domain.auth.exception;

import com.kong.kong_dic.common.exception.BaseExceptionType;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum AuthExceptionType implements BaseExceptionType {
    USER_NOT_FOUND(1, 400, "Cannot find account. Please check entered data."),
    DUPLICATED_USERNAME(2, 400,"ID is duplicated. Please use another one.");

    private final int code;
    private final int httpStatusCode;
    private final String message;
}
