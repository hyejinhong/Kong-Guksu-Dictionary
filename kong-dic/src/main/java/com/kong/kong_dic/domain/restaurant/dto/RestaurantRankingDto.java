package com.kong.kong_dic.domain.restaurant.dto;

import com.kong.kong_dic.domain.restaurant.entity.Restaurant;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

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
    private Long viewCount;
    private int rank;

    public static RestaurantRankingDto of(Restaurant restaurant, int rank) {
        return RestaurantRankingDto.builder()
                .id(restaurant.getId())
                .name(restaurant.getName())
                .address(restaurant.getAddress())
                .averageRating(restaurant.getAverageRating())
                .reviewCount(restaurant.getTotalScraps())
                .viewCount(restaurant.getViewCount())
                .rank(rank)
                .build();
    }
}