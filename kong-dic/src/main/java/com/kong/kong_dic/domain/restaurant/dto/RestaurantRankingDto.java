package com.kong.kong_dic.domain.restaurant.dto;

import com.kong.kong_dic.common.model.BeanType;
import com.kong.kong_dic.domain.restaurant.entity.Restaurant;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RestaurantRankingDto {
    private Long id;
    private String name;
    private String address;
    private Double averageRating;
    private Long reviewCount;
    private Long viewCount;      // 전체 누적 조회수
    private Long dailyViewCount; // 일간 조회수
    private int rank;
    
    private List<BeanType> beanTypes;
    private Boolean servesAllYear;
    private Integer startMonth;
    private Integer endMonth;

    public static RestaurantRankingDto of(Restaurant restaurant, int rank) {
        return RestaurantRankingDto.builder()
                .id(restaurant.getId())
                .name(restaurant.getName())
                .address(restaurant.getAddress())
                .averageRating(restaurant.getAverageRating())
                .reviewCount(restaurant.getTotalScraps())
                .viewCount(restaurant.getViewCount())
                .beanTypes(restaurant.getBeanTypes())
                .servesAllYear(restaurant.getServesAllYear())
                .startMonth(restaurant.getStartMonth())
                .endMonth(restaurant.getEndMonth())
                .rank(rank)
                .build();
    }

    public static RestaurantRankingDto of(Restaurant restaurant, int rank, Long dailyViewCount) {
        return RestaurantRankingDto.builder()
                .id(restaurant.getId())
                .name(restaurant.getName())
                .address(restaurant.getAddress())
                .averageRating(restaurant.getAverageRating())
                .reviewCount(restaurant.getTotalScraps())
                .viewCount(restaurant.getViewCount())
                .dailyViewCount(dailyViewCount)
                .beanTypes(restaurant.getBeanTypes())
                .servesAllYear(restaurant.getServesAllYear())
                .startMonth(restaurant.getStartMonth())
                .endMonth(restaurant.getEndMonth())
                .rank(rank)
                .build();
    }
}