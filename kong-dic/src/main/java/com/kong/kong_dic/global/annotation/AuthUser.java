package com.kong.kong_dic.global.annotation;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * 로그인한 사용자의 정보를 컨트롤러 파라미터로 주입받기 위한 어노테이션
 * @AuthenticationPrincipal 대신 사용하며, 인증되지 않은 경우 예외 발생
 */
@Target(ElementType.PARAMETER)
@Retention(RetentionPolicy.RUNTIME)
public @interface AuthUser {
}
