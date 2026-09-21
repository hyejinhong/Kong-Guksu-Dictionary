package com.kong.kong_dic.domain.image.service;

import com.kong.kong_dic.common.exception.BaseException;
import com.kong.kong_dic.domain.image.dto.ImageUploadResponseDto;
import com.kong.kong_dic.domain.image.exception.ImageExceptionType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.io.IOException;
import java.net.URI;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class ImageUploadService {

    private final S3Client s3Client;

    @Value("${cloudflare.r2.bucket-name:}")
    private String bucketName;

    @Value("${cloudflare.r2.public-url:}")
    private String publicUrl;

    private static final List<String> ALLOWED_EXTENSIONS = Arrays.asList("jpg", "jpeg", "png", "webp", "gif");
    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

    public ImageUploadResponseDto uploadImage(MultipartFile file, String folder) {
        if (file == null || file.isEmpty()) {
            throw new BaseException(ImageExceptionType.EMPTY_FILE);
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new BaseException(ImageExceptionType.FILE_SIZE_EXCEEDED);
        }

        String originalFilename = file.getOriginalFilename();
        String extension = extractExtension(originalFilename);

        if (!ALLOWED_EXTENSIONS.contains(extension.toLowerCase())) {
            throw new BaseException(ImageExceptionType.INVALID_FILE_EXTENSION);
        }

        String key = (folder != null && !folder.isBlank() ? folder.replaceAll("^/+|/+$", "") + "/" : "")
                + UUID.randomUUID() + "." + extension;

        try {
            PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                    .bucket(bucketName)
                    .key(key)
                    .contentType(file.getContentType() != null ? file.getContentType() : "image/" + extension)
                    .build();

            s3Client.putObject(putObjectRequest, RequestBody.fromInputStream(file.getInputStream(), file.getSize()));

            String normalizedPublicUrl = (publicUrl != null && !publicUrl.isBlank())
                    ? (publicUrl.endsWith("/") ? publicUrl.substring(0, publicUrl.length() - 1) : publicUrl)
                    : "";

            String fileUrl = normalizedPublicUrl.isBlank() ? key : normalizedPublicUrl + "/" + key;

            return new ImageUploadResponseDto(fileUrl, key);
        } catch (IOException e) {
            log.error("Failed to upload image to Cloudflare R2", e);
            throw new BaseException(ImageExceptionType.UPLOAD_FAILED);
        } catch (Exception e) {
            log.error("Unexpected error during image upload", e);
            throw new BaseException(ImageExceptionType.UPLOAD_FAILED);
        }
    }

    public void deleteImage(String fileUrlOrKey) {
        if (fileUrlOrKey == null || fileUrlOrKey.isBlank()) {
            return;
        }

        String key = extractKey(fileUrlOrKey);
        if (key == null || key.isBlank()) {
            return;
        }

        try {
            DeleteObjectRequest deleteObjectRequest = DeleteObjectRequest.builder()
                    .bucket(bucketName)
                    .key(key)
                    .build();

            s3Client.deleteObject(deleteObjectRequest);
            log.info("Successfully deleted image from Cloudflare R2. key: {}", key);
        } catch (Exception e) {
            log.warn("Failed to delete image from Cloudflare R2. key: {}, error: {}", key, e.getMessage());
        }
    }

    public String extractKey(String fileUrlOrKey) {
        if (fileUrlOrKey == null || fileUrlOrKey.isBlank()) {
            return null;
        }

        String normalizedPublicUrl = (publicUrl != null && !publicUrl.isBlank())
                ? (publicUrl.endsWith("/") ? publicUrl.substring(0, publicUrl.length() - 1) : publicUrl)
                : "";

        if (!normalizedPublicUrl.isBlank() && fileUrlOrKey.startsWith(normalizedPublicUrl)) {
            String key = fileUrlOrKey.substring(normalizedPublicUrl.length());
            return key.replaceAll("^/+", "");
        }

        if (fileUrlOrKey.startsWith("http://") || fileUrlOrKey.startsWith("https://")) {
            try {
                URI uri = URI.create(fileUrlOrKey);
                String path = uri.getPath();
                if (path != null) {
                    return path.replaceAll("^/+", "");
                }
            } catch (Exception e) {
                log.debug("Failed to parse URI: {}", fileUrlOrKey, e);
            }
        }

        return fileUrlOrKey.replaceAll("^/+", "");
    }

    private String extractExtension(String filename) {
        if (filename == null || !filename.contains(".")) {
            return "jpg";
        }
        return filename.substring(filename.lastIndexOf(".") + 1);
    }
}
