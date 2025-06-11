package com.kong.kong_dic.domain.user.repository;

import com.kong.kong_dic.domain.user.entity.UserRestaurantVisit;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface UserRestaurantVisitRepository extends JpaRepository<UserRestaurantVisit, Long> {
    List<UserRestaurantVisit> findByUserId(Long userId, Pageable pageable);
    void deleteByIdAndUserId(Long id, Long userId);
}
