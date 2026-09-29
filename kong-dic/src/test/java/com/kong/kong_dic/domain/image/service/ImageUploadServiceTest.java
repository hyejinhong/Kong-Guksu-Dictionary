package com.kong.kong_dic.domain.image.service;

import com.kong.kong_dic.common.exception.BaseException;
import com.kong.kong_dic.domain.image.dto.ImageUploadResponseDto;
import com.kong.kong_dic.domain.image.exception.ImageExceptionType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.S3Exception;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ImageUploadServiceTest {

    @Mock
    private S3Client s3Client;

    @InjectMocks
    private ImageUploadService imageUploadService;

    private final String bucketName = "test-bucket";
    private final String publicUrl = "https://pub-test.r2.dev";

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(imageUploadService, "bucketName", bucketName);
        ReflectionTestUtils.setField(imageUploadService, "publicUrl", publicUrl);
    }

    @Test
    @DisplayName("이미지 업로드 성공 - 정상적인 JPG 파일 업로드")
    void uploadImage_success() {
        // given
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "sample.jpg",
                "image/jpeg",
                "test-image-content".getBytes()
        );

        // when
        ImageUploadResponseDto response = imageUploadService.uploadImage(file, "reviews");

        // then
        assertThat(response).isNotNull();
        assertThat(response.getImageUrl()).startsWith("https://pub-test.r2.dev/reviews/");
        assertThat(response.getImageUrl()).endsWith(".jpg");
        assertThat(response.getFileKey()).startsWith("reviews/");
        assertThat(response.getFileKey()).endsWith(".jpg");

        verify(s3Client, times(1)).putObject(any(PutObjectRequest.class), any(RequestBody.class));
    }

    @Test
    @DisplayName("이미지 업로드 실패 - 지원하지 않는 확장자(.exe)")
    void uploadImage_invalidExtension_throwsException() {
        // given
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "malicious.exe",
                "application/octet-stream",
                "fake-content".getBytes()
        );

        // when & then
        assertThatThrownBy(() -> imageUploadService.uploadImage(file, "reviews"))
                .isInstanceOf(BaseException.class)
                .hasFieldOrPropertyWithValue("exceptionType", ImageExceptionType.INVALID_FILE_EXTENSION);

        verify(s3Client, never()).putObject(any(PutObjectRequest.class), any(RequestBody.class));
    }

    @Test
    @DisplayName("이미지 업로드 실패 - 빈 파일인 경우")
    void uploadImage_emptyFile_throwsException() {
        // given
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "empty.png",
                "image/png",
                new byte[0]
        );

        // when & then
        assertThatThrownBy(() -> imageUploadService.uploadImage(file, "reviews"))
                .isInstanceOf(BaseException.class)
                .hasFieldOrPropertyWithValue("exceptionType", ImageExceptionType.EMPTY_FILE);

        verify(s3Client, never()).putObject(any(PutObjectRequest.class), any(RequestBody.class));
    }

    @Test
    @DisplayName("이미지 삭제 성공 - 전체 Public URL이 주어진 경우 key만 추출하여 S3 deleteObject 호출")
    void deleteImage_withFullUrl_deletesCorrectKey() {
        // given
        String fullUrl = "https://pub-test.r2.dev/reviews/test-uuid-1234.jpg";

        // when
        imageUploadService.deleteImage(fullUrl);

        // then
        ArgumentCaptor<DeleteObjectRequest> captor = ArgumentCaptor.forClass(DeleteObjectRequest.class);
        verify(s3Client, times(1)).deleteObject(captor.capture());

        DeleteObjectRequest capturedRequest = captor.getValue();
        assertThat(capturedRequest.bucket()).isEqualTo(bucketName);
        assertThat(capturedRequest.key()).isEqualTo("reviews/test-uuid-1234.jpg");
    }

    @Test
    @DisplayName("이미지 삭제 성공 - 키만 주어진 경우")
    void deleteImage_withKeyOnly_deletesCorrectKey() {
        // given
        String key = "reviews/another-uuid-5678.png";

        // when
        imageUploadService.deleteImage(key);

        // then
        ArgumentCaptor<DeleteObjectRequest> captor = ArgumentCaptor.forClass(DeleteObjectRequest.class);
        verify(s3Client, times(1)).deleteObject(captor.capture());

        DeleteObjectRequest capturedRequest = captor.getValue();
        assertThat(capturedRequest.bucket()).isEqualTo(bucketName);
        assertThat(capturedRequest.key()).isEqualTo("reviews/another-uuid-5678.png");
    }

    @Test
    @DisplayName("이미지 삭제 - null 또는 빈 문자열인 경우 S3Client를 호출하지 않음")
    void deleteImage_nullOrBlank_doesNothing() {
        // when
        imageUploadService.deleteImage(null);
        imageUploadService.deleteImage("");
        imageUploadService.deleteImage("   ");

        // then
        verify(s3Client, never()).deleteObject(any(DeleteObjectRequest.class));
    }

    @Test
    @DisplayName("이미지 삭제 실패 - S3Client 예외 발생 시 예외를 던지지 않고 안전하게 로그만 남김")
    void deleteImage_s3Exception_doesNotThrow() {
        // given
        String fullUrl = "https://pub-test.r2.dev/reviews/fail.jpg";
        doThrow(S3Exception.builder().message("Access Denied").build())
                .when(s3Client).deleteObject(any(DeleteObjectRequest.class));

        // when & then: 예외가 밖으로 던져지지 않아야 함
        imageUploadService.deleteImage(fullUrl);

        verify(s3Client, times(1)).deleteObject(any(DeleteObjectRequest.class));
    }
}
