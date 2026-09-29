package com.kong.kong_dic.domain.image.exception;

import com.kong.kong_dic.common.exception.BaseExceptionType;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum ImageExceptionType implements BaseExceptionType {

    EMPTY_FILE(1, 400, "파일이 비어 있습니다."),
    INVALID_FILE_EXTENSION(2, 400, "지원하지 않는 파일 형식입니다. (jpg, jpeg, png, webp, gif만 지원)"),
    FILE_SIZE_EXCEEDED(3, 400, "파일 크기는 최대 10MB까지 가능합니다."),
    UPLOAD_FAILED(4, 500, "이미지 업로드에 실패했습니다.");

    private final int code;
    private final int httpStatusCode;
    private final String message;
}
