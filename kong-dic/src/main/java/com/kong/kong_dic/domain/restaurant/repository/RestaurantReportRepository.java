package com.kong.kong_dic.domain.restaurant.repository;

import com.kong.kong_dic.common.domain.restaurant.entity.RestaurantReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RestaurantReportRepository extends JpaRepository<RestaurantReport, Long> {
    List<RestaurantReport> findByRestaurantIdOrderByIdDesc(Long restaurantId);
    List<RestaurantReport> findByUserIdOrderByIdDesc(Long userId);
    List<RestaurantReport> findAllByOrderByIdDesc();
}
