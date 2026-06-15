package com.kong.kong_dic.common.domain.restaurant.entity;

import com.kong.kong_dic.common.domain.restaurant.model.SubmissionStatus;
import com.kong.kong_dic.common.model.BeanPrice;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RestaurantSubmission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String address;

    // @Enumerated(EnumType.STRING)
    // private List<BeanType> beanTypes;
    @ElementCollection
    private List<BeanPrice> prices;

    private Boolean servesAllYear;

    private Integer startMonth;
    private Integer endMonth;

    private Double latitude;
    private Double longitude;

    @Column(name = "user_id")
    private Long userId;

    private LocalDateTime createdAt;

    @Builder.Default
    private SubmissionStatus status = SubmissionStatus.PENDING;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    public void approved() {
        this.status = SubmissionStatus.APPROVED;
    }

    public void reject() {
        this.status = SubmissionStatus.REJECTED;
    }
}
