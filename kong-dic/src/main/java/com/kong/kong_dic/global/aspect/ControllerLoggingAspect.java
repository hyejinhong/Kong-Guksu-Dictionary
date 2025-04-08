package com.kong.kong_dic.global.aspect;

import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.stream.Collectors;

@Aspect
@Component
@Slf4j
public class ControllerLoggingAspect {
    @Around("execution(* com.kong.kong_dic..*Controller.*(..))")
    public Object logControllerExecutionTime(ProceedingJoinPoint joinPoint) throws Throwable {
        String className = joinPoint.getTarget().getClass().getSimpleName();
        String methodName = joinPoint.getSignature().getName();

        String params = Arrays.stream(joinPoint.getArgs())
                .map(arg -> arg != null ? arg.toString() : "null")
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
}
