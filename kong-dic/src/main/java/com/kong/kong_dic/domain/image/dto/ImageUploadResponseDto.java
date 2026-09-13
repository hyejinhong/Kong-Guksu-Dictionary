package com.kong.kong_dic.domain.image.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class ImageUploadResponseDto {
    private String imageUrl;
    private String fileKey;
}
