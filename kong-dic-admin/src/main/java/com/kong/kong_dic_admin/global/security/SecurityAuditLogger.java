package com.kong.kong_dic_admin.global.security;

import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * 어드민 서버의 보안(인증/인가) 이벤트를 전용 로거("SECURITY_AUDIT" -> logs/security.log)에 기록하는 유틸리티 클래스.
 */
public final class SecurityAuditLogger {

    public static final String LOGGER_NAME = "SECURITY_AUDIT";
    private static final Logger SECURITY_LOG = LoggerFactory.getLogger(LOGGER_NAME);

    private SecurityAuditLogger() {
    }

    public static void logInfo(String event, String user, HttpServletRequest request, String detail) {
        SECURITY_LOG.info("[SECURITY] event={} | user={} | ip={} | uri={} | detail={}",
                sanitize(event),
                sanitize(defaultUser(user)),
                sanitize(extractClientIp(request)),
                sanitize(extractUri(request)),
                sanitize(detail));
    }

    public static void logWarn(String event, String user, HttpServletRequest request, String detail) {
        SECURITY_LOG.warn("[SECURITY] event={} | user={} | ip={} | uri={} | detail={}",
                sanitize(event),
                sanitize(defaultUser(user)),
                sanitize(extractClientIp(request)),
                sanitize(extractUri(request)),
                sanitize(detail));
    }

    public static void logWarn(String event, String user, String ip, String uri, String detail) {
        SECURITY_LOG.warn("[SECURITY] event={} | user={} | ip={} | uri={} | detail={}",
                sanitize(event),
                sanitize(defaultUser(user)),
                sanitize(ip != null ? ip : "N/A"),
                sanitize(uri != null ? uri : "N/A"),
                sanitize(detail));
    }

    public static void logError(String event, String user, HttpServletRequest request, String detail, Throwable throwable) {
        SECURITY_LOG.error("[SECURITY] event={} | user={} | ip={} | uri={} | detail={}",
                sanitize(event),
                sanitize(defaultUser(user)),
                sanitize(extractClientIp(request)),
                sanitize(extractUri(request)),
                sanitize(detail),
                throwable);
    }

    public static String extractClientIp(HttpServletRequest request) {
        if (request == null) {
            return "N/A";
        }
        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank() && !"unknown".equalsIgnoreCase(xff)) {
            return xff.split(",")[0].trim();
        }
        String realIp = request.getHeader("X-Real-IP");
        if (realIp != null && !realIp.isBlank() && !"unknown".equalsIgnoreCase(realIp)) {
            return realIp.trim();
        }
        return request.getRemoteAddr() != null ? request.getRemoteAddr() : "N/A";
    }

    public static String extractUri(HttpServletRequest request) {
        if (request == null) {
            return "N/A";
        }
        String method = request.getMethod() != null ? request.getMethod() : "";
        String uri = request.getRequestURI() != null ? request.getRequestURI() : "";
        return (method + " " + uri).trim();
    }

    static String defaultUser(String user) {
        return (user == null || user.isBlank()) ? "anonymous" : user;
    }

    static String sanitize(String input) {
        if (input == null) {
            return "";
        }
        return input.replaceAll("[\\r\\n]", "_");
    }
}
