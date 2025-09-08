package com.kong.kong_dic.common.exception;

import lombok.Getter;

@Getter
public class BaseException extends RuntimeException {
    private final BaseExceptionType exceptionType;

    public BaseException(BaseExceptionType exceptionType) {
        super(exceptionType.getMessage());
        this.exceptionType = exceptionType;
    }

    public int getCode() {
        return exceptionType.getCode();
    }

    public int getHttpStatusCode() {
        return exceptionType.getHttpStatusCode();
    }
}
