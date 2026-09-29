package com.kong.kong_dic_admin.domain.restaurant.review.repository;

import com.kong.kong_dic_admin.domain.restaurant.review.entity.UserRestaurantVisit;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AdminReviewRepository extends JpaRepository<UserRestaurantVisit, Long> {

    @Query(value = "SELECT v FROM UserRestaurantVisit v JOIN FETCH v.user JOIN FETCH v.restaurant " +
            "WHERE v.imageUrl IS NOT NULL AND TRIM(v.imageUrl) <> '' ORDER BY v.id DESC",
            countQuery = "SELECT COUNT(v) FROM UserRestaurantVisit v WHERE v.imageUrl IS NOT NULL AND TRIM(v.imageUrl) <> ''")
    Page<UserRestaurantVisit> findAllWithImage(Pageable pageable);

    @Query(value = "SELECT v FROM UserRestaurantVisit v JOIN FETCH v.user JOIN FETCH v.restaurant " +
            "WHERE v.imageUrl IS NOT NULL AND TRIM(v.imageUrl) <> '' AND (v.isImageBlinded = false OR v.isImageBlinded IS NULL) ORDER BY v.id DESC",
            countQuery = "SELECT COUNT(v) FROM UserRestaurantVisit v WHERE v.imageUrl IS NOT NULL AND TRIM(v.imageUrl) <> '' AND (v.isImageBlinded = false OR v.isImageBlinded IS NULL)")
    Page<UserRestaurantVisit> findNormalWithImage(Pageable pageable);

    @Query(value = "SELECT v FROM UserRestaurantVisit v JOIN FETCH v.user JOIN FETCH v.restaurant " +
            "WHERE v.imageUrl IS NOT NULL AND TRIM(v.imageUrl) <> '' AND v.isImageBlinded = true ORDER BY v.id DESC",
            countQuery = "SELECT COUNT(v) FROM UserRestaurantVisit v WHERE v.imageUrl IS NOT NULL AND TRIM(v.imageUrl) <> '' AND v.isImageBlinded = true")
    Page<UserRestaurantVisit> findBlindedWithImage(Pageable pageable);
}
