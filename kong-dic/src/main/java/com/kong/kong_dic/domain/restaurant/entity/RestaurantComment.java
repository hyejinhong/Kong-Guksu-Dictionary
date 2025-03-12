package com.kong.kong_dic.domain.restaurant;

import com.kong.kong_dic.domain.restaurant.entity.Restaurant;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Getter
@NoArgsConstructor
public class RestaurantComment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "restaurant_id", nullable = false)
    private Restaurant restaurant;

    private String author; // 작성자
    private String content; // 댓글 내용
    private LocalDateTime createdAt; // 작성 시간

    public RestaurantComment(Restaurant restaurant, String author, String content) {
        this.restaurant = restaurant;
        this.author = author;
        this.content = content;
        this.createdAt = LocalDateTime.now();
    }

}
