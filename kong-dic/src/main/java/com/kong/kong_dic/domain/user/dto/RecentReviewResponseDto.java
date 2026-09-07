package com.kong.kong_dic.domain.user.dto;

import com.kong.kong_dic.common.model.BeanType;
import com.kong.kong_dic.domain.restaurant.entity.Restaurant;
import com.kong.kong_dic.domain.user.entity.SeasoningPreference;
import com.kong.kong_dic.domain.user.entity.User;
import com.kong.kong_dic.domain.user.entity.UserRestaurantVisit;
import lombok.*;

import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecentReviewResponseDto {
    private Long id;
    private Long restaurantId;
    private String restaurantName;
    private String restaurantAddress;
    private List<BeanType> beanTypes;
    private Boolean servesAllYear;
    private Integer startMonth;
    private Integer endMonth;
    private Double rating;
    private String memo;
    private LocalDate visitDate;
    private Long userId;
    private String nickname;
    private String avatarVariant;
    private String avatarSeed;
    private SeasoningPreference seasoningPreference;

    public static RecentReviewResponseDto from(UserRestaurantVisit visit) {
        Restaurant restaurant = visit.getRestaurant();
        User user = visit.getUser();

        return RecentReviewResponseDto.builder()
                .id(visit.getId())
                .restaurantId(restaurant != null ? restaurant.getId() : null)
                .restaurantName(restaurant != null ? restaurant.getName() : "")
                .restaurantAddress(restaurant != null ? restaurant.getAddress() : "")
                .beanTypes(restaurant != null ? restaurant.getBeanTypes() : null)
                .servesAllYear(restaurant != null ? restaurant.getServesAllYear() : false)
                .startMonth(restaurant != null ? restaurant.getStartMonth() : null)
                .endMonth(restaurant != null ? restaurant.getEndMonth() : null)
                .rating(visit.getRating())
                .memo(visit.getMemo())
                .visitDate(visit.getVisitDate())
                .userId(user != null ? user.getId() : null)
                .nickname(user != null && user.getNickname() != null ? user.getNickname() : (user != null ? user.getUsername() : "익명"))
                .avatarVariant(user != null && user.getAvatarVariant() != null ? user.getAvatarVariant() : "beam")
                .avatarSeed(user != null && user.getAvatarSeed() != null ? user.getAvatarSeed() : "default")
                .seasoningPreference(user != null && user.getSeasoningPreference() != null ? user.getSeasoningPreference() : SeasoningPreference.NONE)
                .build();
    }
}
