package com.kong.kong_dic.global.aspect;

import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Aspect
@Component
@Slf4j
public class ControllerLoggingAspect {

    private static final Pattern SENSITIVE_FIELD_PATTERN = Pattern.compile(
            "(?i)(password|currentPassword|newPassword|token|refreshToken|accessToken|code)\\s*=\\s*([^,\\)\\]]+)"
    );

    @Around("execution(* com.kong.kong_dic..*Controller.*(..))")
    public Object logControllerExecutionTime(ProceedingJoinPoint joinPoint) throws Throwable {
        String className = joinPoint.getTarget().getClass().getSimpleName();
        String methodName = joinPoint.getSignature().getName();

        String params = Arrays.stream(joinPoint.getArgs())
                .map(this::formatArgSafely)
                .collect(Collectors.joining(", "));

        log.info(">>> [Request Start] {}.{}({})", className, methodName, params);

        long start = System.currentTimeMillis();

        try {
            Object result = joinPoint.proceed();
            long duration = System.currentTimeMillis() - start;

            log.info("<<< [Request Completed] {}.{} (Elapsed Time: {} ms)", className, methodName, duration);
            return result;

        } catch (Throwable throwable) {
            log.error("!!! [Exception] {}.{} - {}", className, methodName, throwable.getMessage());
            throw throwable;
        }
    }

    String formatArgSafely(Object arg) {
        if (arg == null) {
            return "null";
        }
        return maskSensitiveFields(arg.toString());
    }

    static String maskSensitiveFields(String raw) {
        if (raw == null) {
            return "null";
        }
        return SENSITIVE_FIELD_PATTERN.matcher(raw).replaceAll("$1=****");
    }
}
