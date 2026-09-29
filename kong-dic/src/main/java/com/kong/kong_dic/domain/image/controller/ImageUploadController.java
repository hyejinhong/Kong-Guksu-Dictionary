package com.kong.kong_dic.domain.image.controller;

import com.kong.kong_dic.common.exception.BaseException;
import com.kong.kong_dic.common.response.BaseResponse;
import com.kong.kong_dic.domain.image.dto.ImageUploadResponseDto;
import com.kong.kong_dic.domain.image.service.ImageUploadService;
import com.kong.kong_dic.domain.user.exception.UserExceptionType;
import com.kong.kong_dic.global.annotation.AuthUser;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/images")
@RequiredArgsConstructor
public class ImageUploadController {

    private final ImageUploadService imageUploadService;

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<BaseResponse<ImageUploadResponseDto>> uploadImage(
            @AuthUser UserDetails userDetails,
            @RequestPart("file") MultipartFile file,
            @RequestParam(value = "folder", defaultValue = "reviews") String folder) {

        if (userDetails == null) {
            throw new BaseException(UserExceptionType.UNAUTHORIZED);
        }

        ImageUploadResponseDto response = imageUploadService.uploadImage(file, folder);
        return ResponseEntity.ok(BaseResponse.success(response));
    }
}
