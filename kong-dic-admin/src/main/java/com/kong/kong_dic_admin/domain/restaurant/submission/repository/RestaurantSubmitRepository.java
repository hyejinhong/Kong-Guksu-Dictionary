package com.kong.kong_dic_admin.domain.restaurant.submission.repository;

import com.kong.kong_dic.domain.restaurant.entity.RestaurantSubmission;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RestaurantSubmitRepository extends JpaRepository<RestaurantSubmission, Long> {
}
