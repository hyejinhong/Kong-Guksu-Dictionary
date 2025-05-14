package com.kong.kong_dic.domain.restaurant.service;

import com.kong.kong_dic.domain.restaurant.RestaurantComment;
import com.kong.kong_dic.domain.restaurant.dto.RestaurantCommentResponseDto;
import com.kong.kong_dic.domain.restaurant.entity.Restaurant;
import com.kong.kong_dic.domain.restaurant.exception.RestaurantExceptionType;
import com.kong.kong_dic.domain.restaurant.repository.RestaurantCommentRepository;
import com.kong.kong_dic.domain.restaurant.repository.RestaurantRepository;
import com.kong.kong_dic.global.exception.BaseException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class RestaurantCommentService {
    private final RestaurantRepository restaurantRepository;
    private final RestaurantCommentRepository commentRepository;

    public Page<RestaurantCommentResponseDto> getComments(Long restaurantId, int page, int size) {
        restaurantRepository.findById(restaurantId)
                .orElseThrow(() -> new BaseException(RestaurantExceptionType.RESTAURANT_NOT_FOUND));

        Pageable pageable = PageRequest.of(page, size);
        Page<RestaurantComment> commentPage = commentRepository.findByRestaurantIdOrderByCreatedAtDesc(restaurantId, pageable);

        return commentPage.map(comment -> RestaurantCommentResponseDto.builder()
                .id(comment.getId())
                .nickname(comment.getAuthor().getNickname())
                .content(comment.getContent())
                .createdAt(comment.getCreatedAt())
                .build());
    }

    private RestaurantCommentResponseDto toDto(RestaurantComment comment) {
        return RestaurantCommentResponseDto.builder()
                .id(comment.getId())
                .nickname(comment.getAuthor().getNickname())
                .content(comment.getContent())
                .createdAt(comment.getCreatedAt())
                .build();
    }
}
