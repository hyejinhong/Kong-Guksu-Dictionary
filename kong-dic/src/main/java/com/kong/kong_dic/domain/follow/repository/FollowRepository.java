package com.kong.kong_dic.domain.follow.repository;

import com.kong.kong_dic.domain.follow.entity.Follow;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface FollowRepository extends JpaRepository<Follow, Long> {

    Optional<Follow> findByFollowerIdAndFollowingId(Long followerId, Long followingId);

    boolean existsByFollowerIdAndFollowingId(Long followerId, Long followingId);

    long countByFollowingId(Long followingId);

    long countByFollowerId(Long followerId);

    @Query(value = "SELECT f FROM Follow f JOIN FETCH f.follower WHERE f.following.id = :userId ORDER BY f.createdAt DESC, f.id DESC",
            countQuery = "SELECT COUNT(f) FROM Follow f WHERE f.following.id = :userId")
    Page<Follow> findFollowersByUserId(@Param("userId") Long userId, Pageable pageable);

    @Query(value = "SELECT f FROM Follow f JOIN FETCH f.following WHERE f.follower.id = :userId ORDER BY f.createdAt DESC, f.id DESC",
            countQuery = "SELECT COUNT(f) FROM Follow f WHERE f.follower.id = :userId")
    Page<Follow> findFollowingsByUserId(@Param("userId") Long userId, Pageable pageable);

    @Query("SELECT f.following.id FROM Follow f WHERE f.follower.id = :followerId AND f.following.id IN :targetIds")
    List<Long> findFollowingIdsByFollowerIdAndTargetIds(@Param("followerId") Long followerId, @Param("targetIds") List<Long> targetIds);
}
