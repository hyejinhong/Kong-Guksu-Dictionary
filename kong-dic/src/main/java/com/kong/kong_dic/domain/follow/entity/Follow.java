package com.kong.kong_dic.domain.follow.entity;

import com.kong.kong_dic.common.exception.BaseException;
import com.kong.kong_dic.domain.user.entity.User;
import com.kong.kong_dic.domain.user.exception.UserExceptionType;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(
        name = "user_follow",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_user_follow_follower_following", columnNames = {"follower_id", "following_id"})
        }
)
public class Follow {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "follower_id", nullable = false)
    private User follower;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "following_id", nullable = false)
    private User following;

    @Builder.Default
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @PrePersist
    @PreUpdate
    public void validateNotSelfFollow() {
        if (follower != null && following != null
                && follower.getId() != null
                && follower.getId().equals(following.getId())) {
            throw new BaseException(UserExceptionType.CANNOT_FOLLOW_SELF);
        }
    }
}
