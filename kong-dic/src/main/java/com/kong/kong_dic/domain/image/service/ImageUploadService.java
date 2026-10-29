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
import java.io.InputStream;
import java.net.URI;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Set;
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
    private static final Set<String> ALLOWED_FOLDERS = Set.of("reviews", "profiles");
    private static final Map<String, String> EXTENSION_TO_MIME = Map.of(
            "jpg", "image/jpeg",
            "jpeg", "image/jpeg",
            "png", "image/png",
            "webp", "image/webp",
            "gif", "image/gif"
    );
    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

    public ImageUploadResponseDto uploadImage(MultipartFile file, String folder) {
        if (file == null || file.isEmpty()) {
            throw new BaseException(ImageExceptionType.EMPTY_FILE);
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new BaseException(ImageExceptionType.FILE_SIZE_EXCEEDED);
        }

        String normalizedFolder = (folder != null && !folder.isBlank())
                ? folder.trim().replaceAll("^/+|/+$", "").toLowerCase()
                : "reviews";

        if (!ALLOWED_FOLDERS.contains(normalizedFolder)) {
            throw new BaseException(ImageExceptionType.INVALID_FOLDER);
        }

        String originalFilename = file.getOriginalFilename();
        String extension = extractExtension(originalFilename).toLowerCase();

        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            throw new BaseException(ImageExceptionType.INVALID_FILE_EXTENSION);
        }

        validateMagicBytes(file);

        String safeContentType = EXTENSION_TO_MIME.getOrDefault(extension, "image/jpeg");
        String key = normalizedFolder + "/" + UUID.randomUUID() + "." + extension;

        try {
            PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                    .bucket(bucketName)
                    .key(key)
                    .contentType(safeContentType)
                    .build();

            s3Client.putObject(putObjectRequest, RequestBody.fromInputStream(file.getInputStream(), file.getSize()));

            String normalizedPublicUrl = getNormalizedPublicUrl();
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

    public void validateImageUrl(String imageUrl, String expectedFolder) {
        if (imageUrl == null || imageUrl.isBlank()) {
            return;
        }

        String trimmed = imageUrl.trim();
        String normalizedPublicUrl = getNormalizedPublicUrl();

        if (!normalizedPublicUrl.isBlank() && (trimmed.startsWith("http://") || trimmed.startsWith("https://"))) {
            if (!trimmed.startsWith(normalizedPublicUrl + "/")) {
                throw new BaseException(ImageExceptionType.INVALID_IMAGE_URL);
            }
        }

        String key = extractKey(trimmed);
        if (key == null || key.isBlank() || key.contains("..") || !key.startsWith(expectedFolder + "/")) {
            throw new BaseException(ImageExceptionType.INVALID_IMAGE_URL);
        }
    }

    public void deleteImage(String fileUrlOrKey) {
        if (fileUrlOrKey == null || fileUrlOrKey.isBlank()) {
            return;
        }

        String key = extractKey(fileUrlOrKey);
        if (key == null || key.isBlank() || key.contains("..")) {
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

        String normalizedPublicUrl = getNormalizedPublicUrl();

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

    private String getNormalizedPublicUrl() {
        return (publicUrl != null && !publicUrl.isBlank())
                ? (publicUrl.endsWith("/") ? publicUrl.substring(0, publicUrl.length() - 1) : publicUrl)
                : "";
    }

    private void validateMagicBytes(MultipartFile file) {
        try (InputStream is = file.getInputStream()) {
            byte[] header = new byte[12];
            int read = is.read(header);
            if (read < 3 || !isValidImageSignature(header, read)) {
                throw new BaseException(ImageExceptionType.INVALID_FILE_EXTENSION);
            }
        } catch (BaseException e) {
            throw e;
        } catch (IOException e) {
            throw new BaseException(ImageExceptionType.UPLOAD_FAILED);
        }
    }

    private boolean isValidImageSignature(byte[] header, int length) {
        // JPEG: FF D8 FF
        if (length >= 3
                && (header[0] & 0xFF) == 0xFF
                && (header[1] & 0xFF) == 0xD8
                && (header[2] & 0xFF) == 0xFF) {
            return true;
        }
        // PNG: 89 50 4E 47 0D 0A 1A 0A
        if (length >= 8
                && (header[0] & 0xFF) == 0x89
                && header[1] == 0x50
                && header[2] == 0x4E
                && header[3] == 0x47
                && header[4] == 0x0D
                && header[5] == 0x0A
                && header[6] == 0x1A
                && header[7] == 0x0A) {
            return true;
        }
        // GIF: GIF87a or GIF89a
        if (length >= 6
                && header[0] == 'G'
                && header[1] == 'I'
                && header[2] == 'F'
                && header[3] == '8'
                && (header[4] == '7' || header[4] == '9')
                && header[5] == 'a') {
            return true;
        }
        // WEBP: RIFF....WEBP
        if (length >= 12
                && header[0] == 'R'
                && header[1] == 'I'
                && header[2] == 'F'
                && header[3] == 'F'
                && header[8] == 'W'
                && header[9] == 'E'
                && header[10] == 'B'
                && header[11] == 'P') {
            return true;
        }
        return false;
    }

    private String extractExtension(String filename) {
        if (filename == null || !filename.contains(".")) {
            return "jpg";
        }
        return filename.substring(filename.lastIndexOf(".") + 1);
    }
}
