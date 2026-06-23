package com.kong.kong_dic.global.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    public void sendPasswordResetEmail(String toEmail, String resetLink) throws MessagingException {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

        try {
            helper.setFrom(fromEmail, "콩국수사전");
        } catch (java.io.UnsupportedEncodingException e) {
            helper.setFrom(fromEmail);
        }
        helper.setTo(toEmail);
        helper.setSubject("[콩국수 사전] 비밀번호 재설정 안내");

        String htmlContent = "<div style=\"max-width: 500px; margin: 0 auto; padding: 30px; font-family: 'Malgun Gothic', sans-serif; border: 1px solid #f1ece1; border-radius: 15px; background-color: #fefcf8;\">" +
                "<h3 style=\"color: #5d4037; font-size: 18px; border-bottom: 2px solid #f7e6c4; padding-bottom: 12px; margin-top: 0;\">안녕하세요, 콩국수 사전입니다.</h3>" +
                "<p style=\"color: #333; font-size: 14px; line-height: 1.6;\">비밀번호 재설정을 위해 아래 버튼을 클릭해 주세요.</p>" +
                "<p style=\"color: #e57373; font-size: 12px; font-weight: bold; margin-bottom: 25px;\">※ 이 링크는 발송 후 15분간 유효합니다.</p>" +
                "<p style=\"text-align: center;\"><a href=\"" + resetLink + "\" target=\"_blank\" style=\"display: inline-block; padding: 12px 30px; background-color: #f7e6c4; color: #5d4037; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px; box-shadow: 0 4px 6px rgba(93,64,55,0.1);\">비밀번호 재설정하러 가기</a></p>" +
                "<br/>" +
                "<p style=\"color: #777; font-size: 12px; line-height: 1.5;\">본인이 요청하지 않은 경우, 이 메일을 무시하셔도 안전합니다.</p>" +
                "<hr style=\"border: 0; border-top: 1px solid #f1ece1; margin: 25px 0;\"/>" +
                "<p style=\"color: #aaa; font-size: 11px; line-height: 1.4; margin-bottom: 0;\">본 메일은 회원 비밀번호 재설정을 위해 발송된 시스템 자동 메일이며 발신 전용입니다.<br/>" +
                "© 콩국수 사전. All rights reserved.</p>" +
                "</div>";

        helper.setText(htmlContent, true);

        mailSender.send(message);
        log.info("Password reset email sent to {}", toEmail);
    }

    public void sendVerificationEmail(String toEmail, String code) throws MessagingException {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

        try {
            helper.setFrom(fromEmail, "콩국수사전");
        } catch (java.io.UnsupportedEncodingException e) {
            helper.setFrom(fromEmail);
        }
        helper.setTo(toEmail);
        helper.setSubject("[콩국수 사전] 이메일 인증 번호 안내");

        String htmlContent = "<div style=\"max-width: 500px; margin: 0 auto; padding: 30px; font-family: 'Malgun Gothic', sans-serif; border: 1px solid #f1ece1; border-radius: 15px; background-color: #fefcf8;\">" +
                "<h3 style=\"color: #5d4037; font-size: 18px; border-bottom: 2px solid #f7e6c4; padding-bottom: 12px; margin-top: 0;\">안녕하세요, 콩국수 사전입니다.</h3>" +
                "<p style=\"color: #333; font-size: 14px; line-height: 1.6;\">이메일 인증을 위한 6자리 번호는 다음과 같습니다.</p>" +
                "<div style=\"background-color: #f7e6c4; padding: 15px; border-radius: 10px; text-align: center; margin: 20px 0;\">" +
                "<span style=\"color: #5d4037; font-size: 24px; font-weight: bold; letter-spacing: 5px;\">" + code + "</span>" +
                "</div>" +
                "<p style=\"color: #e57373; font-size: 12px; font-weight: bold; margin-bottom: 25px;\">※ 이 인증번호는 발송 후 5분간 유효합니다.</p>" +
                "<br/>" +
                "<p style=\"color: #777; font-size: 12px; line-height: 1.5;\">본인이 요청하지 않은 경우, 이 메일을 무시하셔도 안전합니다.</p>" +
                "<hr style=\"border: 0; border-top: 1px solid #f1ece1; margin: 25px 0;\"/>" +
                "<p style=\"color: #aaa; font-size: 11px; line-height: 1.4; margin-bottom: 0;\">본 메일은 회원 이메일 인증을 위해 발송된 시스템 자동 메일이며 발신 전용입니다.<br/>" +
                "© 콩국수 사전. All rights reserved.</p>" +
                "</div>";

        helper.setText(htmlContent, true);

        mailSender.send(message);
        log.info("Verification email sent to {}", toEmail);
    }
}
