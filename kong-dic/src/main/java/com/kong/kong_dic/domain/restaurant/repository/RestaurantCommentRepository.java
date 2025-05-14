package com.kong.kong_dic.domain.restaurant.repository;

import com.kong.kong_dic.domain.restaurant.RestaurantComment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RestaurantCommentRepository extends JpaRepository<RestaurantComment, Long> {
    Page<RestaurantComment> findByRestaurantIdOrderByCreatedAtDesc(Long restaurantId, Pageable pageable);

}
