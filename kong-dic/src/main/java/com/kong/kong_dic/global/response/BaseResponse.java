package com.kong.kong_dic.global.response;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public class BaseResponse<T> {
    private final int code;
    private final String message;
    private final T data;

    public static BaseResponse<Void> success(String message) {
        return new BaseResponse<>(0, message, null);
    }

    public static <T> BaseResponse<T> success(String message, T data) {
        return new BaseResponse<>(0, message, data);
    }

    public static BaseResponse<Void> error(int code, String message) {
        return new BaseResponse<>(code, message, null);
    }
}
