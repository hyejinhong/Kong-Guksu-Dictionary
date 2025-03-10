package com.kong.kong_dic.domain.restaurant.entity;

import com.kong.kong_dic.domain.bean.BeanType;
import jakarta.persistence.*;

import java.time.LocalDate;

@Entity
public class Restaurant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String address;
    private Double latitude;
    private Double longitude;

    @Enumerated(EnumType.STRING)
    private BeanType beanType;

    private Boolean servesAllYear;

    private LocalDate startDate;
    private LocalDate endDate;
}
