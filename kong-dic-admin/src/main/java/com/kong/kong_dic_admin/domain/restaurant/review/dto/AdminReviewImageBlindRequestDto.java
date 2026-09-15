package com.kong.kong_dic_admin.domain.restaurant.review.dto;

import com.kong.kong_dic.common.model.BlindReason;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AdminReviewImageBlindRequestDto {
    private boolean blind;
    private BlindReason reason;
}
