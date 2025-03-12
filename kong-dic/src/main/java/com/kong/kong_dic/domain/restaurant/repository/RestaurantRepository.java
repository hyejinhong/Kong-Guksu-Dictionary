package com.kong.kong_dic.domain.restaurant.repository;

import com.kong.kong_dic.domain.bean.BeanType;
import com.kong.kong_dic.domain.restaurant.entity.Restaurant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface RestaurantRepository extends JpaRepository<Restaurant, Long> {
    List<Restaurant> findByBeanType(BeanType beanType);

    @Query(value = """
        SELECT *, 
        (6371 * acos(cos(radians(:latitude)) * cos(radians(r.latitude)) 
        * cos(radians(r.longitude) - radians(:longitude)) 
        + sin(radians(:latitude)) * sin(radians(r.latitude)))) AS distance
        FROM restaurant r
        HAVING distance <= :distance
        ORDER BY distance
    """, nativeQuery = true)
    List<Restaurant> findNearbyRestaurants(
            @Param("latitude") double latitude,
            @Param("longitude") double longitude,
            @Param("distance") double distance
    );
}
