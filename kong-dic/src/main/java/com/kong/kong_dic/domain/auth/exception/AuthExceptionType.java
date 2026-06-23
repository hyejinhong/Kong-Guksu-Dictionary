package com.kong.kong_dic.domain.auth.exception;

import com.kong.kong_dic.common.exception.BaseExceptionType;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum AuthExceptionType implements BaseExceptionType {
    USER_NOT_FOUND(1, 400, "Cannot find account. Please check entered data."),
    DUPLICATED_USERNAME(2, 400,"ID is duplicated. Please use another one."),
    INVALID_REFRESH_TOKEN(3, 401, "Invalid refresh token. Please login again."),
    DUPLICATED_EMAIL(4, 400, "Email is duplicated. Please use another one."),
    INVALID_RESET_TOKEN(5, 400, "Invalid or expired password reset token."),
    USER_EMAIL_MISMATCH(6, 400, "Username and email do not match."),
    INVALID_VERIFICATION_CODE(7, 400, "Invalid or expired verification code.");

    private final int code;
    private final int httpStatusCode;
    private final String message;
}
