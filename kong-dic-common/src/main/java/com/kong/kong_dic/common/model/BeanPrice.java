package com.kong.kong_dic.common.model;

import jakarta.persistence.Embeddable;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import lombok.*;

@Embeddable
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BeanPrice {
    @Enumerated(EnumType.STRING)
    private BeanType beanType;

    private Integer price; // 또는 Double
}
