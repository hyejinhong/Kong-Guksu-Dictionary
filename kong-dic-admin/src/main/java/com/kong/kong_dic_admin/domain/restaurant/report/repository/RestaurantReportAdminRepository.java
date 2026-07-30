package com.kong.kong_dic_admin.domain.restaurant.report.repository;

import com.kong.kong_dic.common.domain.restaurant.entity.RestaurantReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RestaurantReportAdminRepository extends JpaRepository<RestaurantReport, Long> {
    List<RestaurantReport> findAllByOrderByIdDesc();
}
