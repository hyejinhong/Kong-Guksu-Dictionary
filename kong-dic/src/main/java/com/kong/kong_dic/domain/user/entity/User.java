package com.kong.kong_dic.domain.user.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.sql.Date;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "user")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Builder.Default
    @Column(name = "public_id", unique = true, length = 36)
    private String publicId = UUID.randomUUID().toString();

    @Column(nullable = false, unique = true)
    private String username;

    @Column(nullable = false)
    private String password;

    private String nickname;

    @Column(unique = true)
    private String email;

    @Enumerated(EnumType.STRING)
    private Role role; // ADMIN or USER

    @Builder.Default
    @Column(name = "avatar_variant", nullable = false)
    private String avatarVariant = "beam";

    @Builder.Default
    @Column(name = "avatar_seed", nullable = false)
    private String avatarSeed = "default";

    @Column(name = "profile_image_url")
    private String profileImageUrl;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    @Column(name = "seasoning_preference", nullable = false)
    private SeasoningPreference seasoningPreference = SeasoningPreference.NONE;

    @Builder.Default
    private Date registeredAt = new Date(System.currentTimeMillis());

    @Builder.Default
    private Date modifiedAt = new Date(System.currentTimeMillis());

    @Column(nullable = false, columnDefinition = "tinyint(1) default 1")
    @Builder.Default
    private boolean enabled = true;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<UserRestaurantVisit> visitedRestaurants = new ArrayList<>();

    @PrePersist
    public void prePersist() {
        if (this.publicId == null || this.publicId.isBlank()) {
            this.publicId = UUID.randomUUID().toString();
        }
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(role);
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return enabled;
    }
}
