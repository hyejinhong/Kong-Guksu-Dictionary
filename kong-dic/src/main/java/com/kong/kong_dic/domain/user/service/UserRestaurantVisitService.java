package com.kong.kong_dic.domain.user.service;

import com.kong.kong_dic.domain.user.dto.UserRestaurantVisitResponseDto;
import com.kong.kong_dic.domain.user.entity.User;
import com.kong.kong_dic.domain.user.entity.UserRestaurantVisit;
import com.kong.kong_dic.domain.user.repository.UserRestaurantVisitRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserRestaurantVisitService {

    private final UserRestaurantVisitRepository visitRepository;

    public List<UserRestaurantVisitResponseDto> getVisitedRestaurants(User user) {
        List<UserRestaurantVisit> entityList = visitRepository.findByUserId(user.getId());
        // TODO entity to Dto
    }

}
