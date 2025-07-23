package com.kong.kong_dic.domain.restaurant.entity;

import com.kong.kong_dic.domain.bean.BeanType;
import com.kong.kong_dic.domain.bean.domain.BeanPrice;
import com.kong.kong_dic.domain.restaurant.RestaurantComment;
import com.kong.kong_dic.domain.user.entity.UserRestaurantVisit;
import jakarta.persistence.*;
import lombok.*;

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
    @Builder.Default
    private List<RestaurantComment> comments = new ArrayList<>();

    @ElementCollection
    private List<BeanType> beanTypes;

    private Boolean servesAllYear;

    private Integer startMonth;
    private Integer endMonth;

    @ElementCollection
    @Builder.Default
    // @CollectionTable(name = "restaurant_prices", joinColumns = @JoinColumn(name = "restaurant_id"))
    private List<BeanPrice> prices = new ArrayList<>();

    @OneToMany(mappedBy = "restaurant", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<UserRestaurantVisit> userVisits = new ArrayList<>(); // 이 식당을 방문한 사용자 목록
}
