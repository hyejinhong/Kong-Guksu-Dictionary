package com.kong.kong_dic.domain.restaurant.exception;

import com.kong.kong_dic.common.exception.BaseExceptionType;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum RestaurantExceptionType implements BaseExceptionType {
    RESTAURANT_NOT_FOUND(1, 404, "식당을 찾을 수 없습니다."),
    COMMENT_NOT_FOUND(2, 400, "댓글을 찾을 수 없습니다.");

    private final int code;
    private final int httpStatusCode;
    private final String message;
}
