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
        // 파라미터에 @AuthUser 어노테이션이 붙어있고, 타입이 UserDetails인지 확인
        return parameter.hasParameterAnnotation(AuthUser.class)
                && UserDetails.class.isAssignableFrom(parameter.getParameterType());
    }

    @Override
    public Object resolveArgument(MethodParameter parameter, ModelAndViewContainer mavContainer,
                                  NativeWebRequest webRequest, WebDataBinderFactory binderFactory) throws Exception {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        // 1. 인증 객체가 없거나 익명, 인증 안 된 경우
        if (authentication == null ||
        authentication.getPrincipal().equals("anonymousUser") ||
        !authentication.isAuthenticated()) {
            throw new BaseException(UserExceptionType.UNAUTHORIZED);
        }

        // 2. Principal return
        Object principal = authentication.getPrincipal();
        if (!(principal instanceof UserDetails)) {
            throw new BaseException(UserExceptionType.UNAUTHORIZED);
        }
        return principal;
    }
}
