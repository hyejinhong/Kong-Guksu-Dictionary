package com.kong.kong_dic.domain.user.entity;

import com.kong.kong_dic.domain.restaurant.entity.Restaurant;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Getter @Setter @Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "user_restaurant_visit", uniqueConstraints = {@UniqueConstraint(columnNames = {"user_id", "restaurant_id"})}) // 동시성 방지
public class UserRestaurantVisit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY) // User 엔티티와 다대일 관계
    @JoinColumn(name = "user_id", nullable = false) // user_id 컬럼으로 매핑, null 불허
    private User user;

    @ManyToOne(fetch = FetchType.LAZY) // Restaurant 엔티티와 다대일 관계
    @JoinColumn(name = "restaurant_id", nullable = false) // restaurant_id 컬럼으로 매핑, null 불허
    private Restaurant restaurant;

    private LocalDate visitDate; // 방문 일자
    private Double rating;      // 사용자가 매긴 별점
    private String memo;         // 사용자의 짧은 메모

    public void updateRating(Double rating) {
        this.rating = rating;
    }
}