package com.kong.kong_dic_admin.domain.restaurant.review.entity;

import com.kong.kong_dic.common.model.BlindReason;
import com.kong.kong_dic_admin.domain.restaurant.entity.Restaurant;
import com.kong.kong_dic_admin.domain.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_restaurant_visit")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserRestaurantVisit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "restaurant_id", nullable = false)
    private Restaurant restaurant;

    private LocalDate visitDate;
    private Double rating;
    private String memo;
    private String imageUrl;

    @Builder.Default
    @Column(name = "is_image_blinded", nullable = false)
    private Boolean isImageBlinded = false;

    @Enumerated(EnumType.STRING)
    @Column(name = "image_blind_reason", length = 50)
    private BlindReason imageBlindReason;

    @Column(name = "image_blinded_at")
    private LocalDateTime imageBlindedAt;

    public void blindImage(BlindReason reason) {
        this.isImageBlinded = true;
        this.imageBlindReason = reason;
        this.imageBlindedAt = LocalDateTime.now();
    }

    public void unblindImage() {
        this.isImageBlinded = false;
        this.imageBlindReason = null;
        this.imageBlindedAt = null;
    }
}
