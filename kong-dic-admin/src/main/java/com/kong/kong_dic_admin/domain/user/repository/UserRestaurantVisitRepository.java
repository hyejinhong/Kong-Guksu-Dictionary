package com.kong.kong_dic_admin.domain.user.repository;

import com.kong.kong_dic.domain.user.entity.UserRestaurantVisit;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UserRestaurantVisitRepository extends JpaRepository<UserRestaurantVisit, Long> {
    List<UserRestaurantVisit> findByUserId(Long userId, Pageable pageable);
    void deleteByIdAndUserId(Long id, Long userId);
    @Query("SELECT urv FROM UserRestaurantVisit urv WHERE urv.user.id = :userId AND urv.restaurant.id = :restaurantId")
    Optional<UserRestaurantVisit> findByUserIdAndRestaurantId(@Param("userId") Long userId, @Param("restaurantId") Long restaurantId);
}
