package com.kong.kong_dic.domain.restaurant.entity;

import com.kong.kong_dic.domain.bean.BeanType;
import com.kong.kong_dic.domain.restaurant.RestaurantComment;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.MonthDay;
import java.util.ArrayList;
import java.util.List;

@Entity
@Getter @Setter @Builder
@NoArgsConstructor
@AllArgsConstructor
public class Restaurant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String address;
    private Double latitude;
    private Double longitude;

    @OneToMany(mappedBy = "restaurant", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<RestaurantComment> comments = new ArrayList<>();

    @Enumerated(EnumType.STRING)
    private BeanType beanType;

    private Boolean servesAllYear;

    private MonthDay startDate;
    private MonthDay endDate;
}
