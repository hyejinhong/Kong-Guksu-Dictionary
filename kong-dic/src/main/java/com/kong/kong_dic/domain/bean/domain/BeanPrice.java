package com.kong.kong_dic.domain.bean.domain;

import com.kong.kong_dic.domain.bean.BeanType;
import jakarta.persistence.Embeddable;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Embeddable
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class BeanPrice {
    @Enumerated(EnumType.STRING)
    private BeanType beanType;

    private Integer price; // 또는 Double
}
