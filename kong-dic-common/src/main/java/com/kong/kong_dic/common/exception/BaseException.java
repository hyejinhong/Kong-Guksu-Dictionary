package com.kong.kong_dic.common.exception;

import lombok.Getter;

@Getter
public class BaseException extends RuntimeException {
    private final BaseExceptionType exceptionType;
    private String customMessage;

    public BaseException(BaseExceptionType exceptionType) {
        super(exceptionType.getMessage());
        this.exceptionType = exceptionType;
    }

    // 오버라이트할 메시지 있는 경우
    public BaseException(BaseExceptionType exceptionType, String message) {
        super(exceptionType.getMessage());
        this.exceptionType = exceptionType;
        this.customMessage = message;
    }

    public int getCode() {
        return exceptionType.getCode();
    }

    public int getHttpStatusCode() {
        return exceptionType.getHttpStatusCode();
    }

    @Override
    public String getMessage() {
        return customMessage != null ? customMessage : exceptionType.getMessage();
    }
}
