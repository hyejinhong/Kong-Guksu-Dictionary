package com.kong.kong_dic.common.domain.restaurant.entity;

import com.kong.kong_dic.common.domain.restaurant.model.ReportCategory;
import com.kong.kong_dic.common.domain.restaurant.model.ReportStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RestaurantReport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "restaurant_id", nullable = false)
    private Long restaurantId;

    @Column(name = "user_id")
    private Long userId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ReportCategory category;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private ReportStatus status = ReportStatus.PENDING;

    @Column(columnDefinition = "TEXT")
    private String reply;

    private LocalDateTime repliedAt;

    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    public void updateReply(String reply, ReportStatus status) {
        this.reply = reply;
        this.repliedAt = LocalDateTime.now();
        if (status != null) {
            this.status = status;
        }
    }

    public void resolve() {
        this.status = ReportStatus.RESOLVED;
    }

    public void reject() {
        this.status = ReportStatus.REJECTED;
    }
}
