package com.kong.kong_dic.domain.restaurant.entity;

import com.kong.kong_dic.common.model.BeanPrice;
import com.kong.kong_dic.common.model.BeanType;
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

    @Column(nullable = false)
    @Builder.Default
    private Long totalScraps = 0L;

    @Column(nullable = false)
    @Builder.Default
    private Double averageRating = 0.0;

    private Long viewCount = 0L;

    public void addViewCount(Long count) {
        this.viewCount += count;
    }

    // 통계 업데이트
    public void updateStats(Long count, Double rating) {
        this.totalScraps = count;
        this.averageRating = rating;
    }
}
