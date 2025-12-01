package com.kong.kong_dic.domain.user.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class RatingStatsDto {

    private Long count;      // 저장/방문 수 (COUNT)
    private Double average;  // 평균 별점 (AVG) - 데이터가 없으면 null일 수 있음

    /**
     * 데이터가 없을 경우를 위한 빈 객체 생성 메서드
     */
    public static RatingStatsDto empty() {
        return new RatingStatsDto(0L, 0.0);
    }

    // JPQL에서 new 생성자로 호출할 때 Double이 null로 들어올 수 있으므로
    // 이를 안전하게 처리하기 위한 Getter를 추가로 정의하거나 서비스에서 처리할 수 있습니다.
    // 여기서는 서비스 로직에서 null 체크를 하므로 기본 Getter로 충분합니다.

    public Double getAverage() {
        return average != null ? average : 0.0;
    }
}