package com.kong.kong_dic.global.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3Configuration;

import java.net.URI;

@Configuration
public class R2Config {

    @Value("${cloudflare.r2.account-id:}")
    private String accountId;

    @Value("${cloudflare.r2.endpoint:}")
    private String endpoint;

    @Value("${cloudflare.r2.access-key:}")
    private String accessKey;

    @Value("${cloudflare.r2.secret-key:}")
    private String secretKey;

    @Bean
    public S3Client s3Client() {
        String effectiveEndpoint = getEffectiveEndpoint();

        if (effectiveEndpoint.isBlank() || accessKey.isBlank() || secretKey.isBlank()) {
            // R2 자격 증명이 설정되지 않았을 경우 더미 클라이언트로 구동 (앱 기동 실패 방지)
            return S3Client.builder()
                    .region(Region.of("auto"))
                    .endpointOverride(URI.create("https://dummy.r2.cloudflarestorage.com"))
                    .credentialsProvider(StaticCredentialsProvider.create(
                            AwsBasicCredentials.create("dummy", "dummy")))
                    .build();
        }

        return S3Client.builder()
                .endpointOverride(URI.create(effectiveEndpoint))
                .credentialsProvider(StaticCredentialsProvider.create(
                        AwsBasicCredentials.create(accessKey, secretKey)))
                .region(Region.of("auto"))
                .serviceConfiguration(S3Configuration.builder()
                        .pathStyleAccessEnabled(true)
                        .build())
                .build();
    }

    private String getEffectiveEndpoint() {
        if (endpoint != null && !endpoint.isBlank()) {
            return endpoint;
        }
        if (accountId != null && !accountId.isBlank()) {
            return "https://" + accountId + ".r2.cloudflarestorage.com";
        }
        return "";
    }
}
