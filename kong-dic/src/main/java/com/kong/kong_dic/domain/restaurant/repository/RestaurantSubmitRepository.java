package com.kong.kong_dic.domain.restaurant.repository;

import com.kong.kong_dic.common.domain.restaurant.entity.RestaurantSubmission;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RestaurantSubmitRepository extends JpaRepository<RestaurantSubmission, Long> {
    List<RestaurantSubmission> findByUserIdOrderByIdDesc(Long userId);
}
