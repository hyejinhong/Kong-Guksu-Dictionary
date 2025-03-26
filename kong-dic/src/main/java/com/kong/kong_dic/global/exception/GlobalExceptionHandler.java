package com.kong.kong_dic.global.exception;

import com.kong.kong_dic.global.response.BaseResponse;
import io.swagger.v3.oas.annotations.Hidden;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@Hidden
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(BaseException.class)
    public ResponseEntity<BaseResponse<Void>> handleBaseException(BaseException ex) {
        return ResponseEntity
                .status(ex.getHttpStatusCode())
                .body(BaseResponse.error(ex.getCode(), ex.getMessage()));
    }
}
