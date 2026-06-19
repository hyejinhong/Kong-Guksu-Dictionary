package com.kong.kong_dic.domain.restaurant.repository;

import com.kong.kong_dic.common.model.BeanType;
import com.kong.kong_dic.domain.restaurant.entity.Restaurant;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface RestaurantRepository extends JpaRepository<Restaurant, Long>, JpaSpecificationExecutor<Restaurant> {
    Page<Restaurant> findByBeanTypesContains(BeanType beanType, Pageable pageable);

    Optional<Restaurant> findByNameAndAddress(String name, String address);

    @Query(value = """
    SELECT *, 
    (6371 * acos(cos(radians(:latitude)) * cos(radians(r.latitude)) 
    * cos(radians(r.longitude) - radians(:longitude)) 
    + sin(radians(:latitude)) * sin(radians(r.latitude)))) AS distance
    FROM restaurant r
    HAVING distance <= :distance
    ORDER BY distance
    """,
            countQuery = """
    SELECT COUNT(*) 
    FROM (
        SELECT (6371 * acos(cos(radians(:latitude)) * cos(radians(r.latitude)) 
        * cos(radians(r.longitude) - radians(:longitude)) 
        + sin(radians(:latitude)) * sin(radians(r.latitude)))) AS distance
        FROM restaurant r
        HAVING distance <= :distance
    ) AS count_table
    """,
            nativeQuery = true)
    Page<Restaurant> findNearbyRestaurants(
            @Param("latitude") double latitude,
            @Param("longitude") double longitude,
            @Param("distance") double distance,
            Pageable pageable
    );

    List<Restaurant> findTop10ByOrderByAverageRatingDesc();
}

