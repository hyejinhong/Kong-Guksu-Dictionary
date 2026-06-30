package com.kong.kong_dic.domain.restaurant.repository;

import com.kong.kong_dic.domain.restaurant.entity.RestaurantComment;
import com.kong.kong_dic.domain.restaurant.entity.Restaurant;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface RestaurantCommentRepository extends JpaRepository<RestaurantComment, Long> {
    @EntityGraph(attributePaths = {"author"})
    Page<RestaurantComment> findByRestaurantIdOrderByCreatedAtDesc(Long restaurantId, Pageable pageable);

    @Query(value = "SELECT c FROM RestaurantComment c " +
            "JOIN FETCH c.restaurant r " +
            "JOIN c.author a " +
            "WHERE a.id = :userId",
            countQuery = "SELECT count(c) FROM RestaurantComment c " +
                    "JOIN c.author a " +
                    "WHERE a.id = :userId")
    Page<RestaurantComment> findAllByUserId(@Param("userId") Long userId, Pageable pageable);
}
