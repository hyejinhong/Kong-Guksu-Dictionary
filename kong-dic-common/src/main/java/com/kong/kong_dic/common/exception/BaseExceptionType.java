package com.kong.kong_dic.common.exception;

public interface BaseExceptionType {
    int getCode();
    int getHttpStatusCode();
    String getMessage();
}
