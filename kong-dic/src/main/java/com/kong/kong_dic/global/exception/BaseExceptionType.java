package com.kong.kong_dic.global.exception;

public interface BaseExceptionType {
    int getCode();
    int getHttpStatusCode();
    String getMessage();
}
