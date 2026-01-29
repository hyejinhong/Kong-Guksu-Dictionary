package com.kong.kong_dic.global.resolver;

import com.kong.kong_dic.common.exception.BaseException;
import com.kong.kong_dic.domain.user.exception.UserExceptionType;
import com.kong.kong_dic.global.annotation.AuthUser;
import org.springframework.core.MethodParameter;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;

@Component
public class AuthUserArgumentResolver implements HandlerMethodArgumentResolver {

    @Override
    public boolean supportsParameter(MethodParameter parameter) {
        // 파라미터에 @AuthUser 어노테이션이 붙어있고, 타입이 UserDetails(혹은 하위 타입)인지 확인
        return parameter.hasParameterAnnotation(AuthUser.class)
                && UserDetails.class.isAssignableFrom(parameter.getParameterType());
    }

    @Override
    public Object resolveArgument(MethodParameter parameter, ModelAndViewContainer mavContainer,
                                  NativeWebRequest webRequest, WebDataBinderFactory binderFactory) {

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        // 1. 어노테이션에 설정된 required 값 가져오기
        AuthUser authUser = parameter.getParameterAnnotation(AuthUser.class);
        boolean isRequired = (authUser != null) && authUser.required();

        // 2. 인증 상태 확인 (인증 정보가 없거나, 익명 사용자거나, 인증되지 않은 경우)
        boolean isUnauthenticated = authentication == null ||
                authentication.getPrincipal().equals("anonymousUser") ||
                !authentication.isAuthenticated();

        if (isUnauthenticated) {
            // 필수(required=true)인 경우에만 예외를 던지고,
            // 필수가 아니면(required=false) null을 반환해서 비회원도 통과
            if (isRequired) {
                throw new BaseException(UserExceptionType.UNAUTHORIZED);
            }
            return null;
        }

        // 3. Principal 반환 (UserDetails로 캐스팅)
        Object principal = authentication.getPrincipal();
        if (!(principal instanceof UserDetails)) {
            // 상황에 따라 500 에러나 401 에러로 처리
            throw new BaseException(UserExceptionType.USER_NOT_FOUND);
        }

        return principal;
    }
}