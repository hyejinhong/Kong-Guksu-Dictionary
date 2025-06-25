package com.kong.kong_dic.domain.restaurant.entity;

import com.kong.kong_dic.domain.bean.BeanType;
import com.kong.kong_dic.domain.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

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

    @Enumerated(EnumType.STRING)
    private List<BeanType> beanTypes;

    private Boolean servesAllYear;

    private Integer startMonth;
    private Integer endMonth;

    private Double latitude;
    private Double longitude;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Builder.Default
    private SubmissionStatus status = SubmissionStatus.PENDING;

    public void approved() {
        this.status = SubmissionStatus.APPROVED;
    }

    public void reject() {
        this.status = SubmissionStatus.REJECTED;
    }
}
