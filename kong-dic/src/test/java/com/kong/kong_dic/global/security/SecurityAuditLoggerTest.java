package com.kong.kong_dic.global.security;

import ch.qos.logback.classic.Level;
import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.read.ListAppender;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.slf4j.LoggerFactory;
import org.springframework.mock.web.MockHttpServletRequest;

import static org.assertj.core.api.Assertions.assertThat;

class SecurityAuditLoggerTest {

    private Logger securityLogger;
    private ListAppender<ILoggingEvent> listAppender;

    @BeforeEach
    void setUp() {
        securityLogger = (Logger) LoggerFactory.getLogger(SecurityAuditLogger.LOGGER_NAME);
        listAppender = new ListAppender<>();
        listAppender.start();
        securityLogger.addAppender(listAppender);
    }

    @AfterEach
    void tearDown() {
        securityLogger.detachAppender(listAppender);
    }

    @Test
    @DisplayName("보안 이벤트(INFO/WARN)가 전용 SECURITY_AUDIT 로거에 구조화된 포맷으로 기록된다")
    void logWarn_writesStructuredFormatToSecurityAuditLogger() {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/login");
        request.setRemoteAddr("127.0.0.1");
        request.addHeader("X-Forwarded-For", "203.0.113.10, 10.0.0.1");

        SecurityAuditLogger.logWarn("LOGIN_FAILURE", "hacker", request, "Bad credentials");

        assertThat(listAppender.list).hasSize(1);
        ILoggingEvent event = listAppender.list.get(0);
        assertThat(event.getLevel()).isEqualTo(Level.WARN);
        assertThat(event.getFormattedMessage())
                .contains("event=LOGIN_FAILURE")
                .contains("user=hacker")
                .contains("ip=203.0.113.10")
                .contains("uri=POST /login")
                .contains("detail=Bad credentials");
    }

    @Test
    @DisplayName("Log Injection 방지를 위해 개행문자(\\r, \\n)를 언더스코어로 치환한다")
    void logWarn_sanitizesCrLfCharacters() {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/admin/users");

        SecurityAuditLogger.logWarn("ACCESS_DENIED", "evil\r\nFAKE_LOG", request, "detail\nline2");

        assertThat(listAppender.list).hasSize(1);
        String msg = listAppender.list.get(0).getFormattedMessage();
        assertThat(msg).doesNotContain("\r").doesNotContain("\n");
        assertThat(msg).contains("user=evil__FAKE_LOG");
    }
}
