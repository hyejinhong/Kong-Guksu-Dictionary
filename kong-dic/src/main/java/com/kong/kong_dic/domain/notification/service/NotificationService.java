package com.kong.kong_dic.domain.notification.service;

import com.kong.kong_dic.domain.notification.dto.NotificationMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Range;
import org.springframework.data.redis.connection.stream.MapRecord;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NotificationService {

    // RedisTemplate<String, String> 대신 StringRedisTemplate을 사용하면 Redis Stream 관련 작업에 더 적합합니다.
    private final StringRedisTemplate redisTemplate;
    // ObjectMapper는 더 이상 직접 JSON 역직렬화를 할 필요가 없어졌으므로 제거하거나 주석 처리할 수 있습니다.
    // private final ObjectMapper objectMapper = new ObjectMapper();

    public List<NotificationMessage> getAllNotifications(String username) {
        // 사용자별 스트림 키를 동적으로 생성
        String streamKey = "notifications:" + username;

        // 해당 사용자 스트림의 전체 메시지 읽기 (가장 오래된 것부터 최신까지)
        // ReadOffset.from("0-0") 또는 Range.unbounded()를 사용하면 모든 메시지를 가져올 수 있습니다.
        // 여기서는 Range.unbounded()를 사용하여 모든 메시지 ID를 포함합니다.
        List<MapRecord<String, Object, Object>> messages = redisTemplate.opsForStream()
                .range(streamKey, Range.unbounded()); // << 변경: 스트림 키를 사용자별로!

        // null 체크
        if (messages == null || messages.isEmpty()) {
            return List.of(); // 빈 리스트 반환
        }

        // MapRecord에서 직접 DTO로 변환
        return messages.stream()
                .map(record -> {
                    Map<Object, Object> body = record.getValue();
                    // Redis Stream에 저장된 필드들을 직접 가져와 NotificationMessage 객체 생성
                    // RedisStreamPublisher가 'username', 'content', 'type'을 각각의 Map 엔트리로 저장했으므로
                    // 그에 맞춰 여기서도 각 필드를 직접 가져옵니다.
                    String retrievedUsername = (String) body.get("username");
                    String content = (String) body.get("content");
                    String type = (String) body.get("type");
                    // 만약 'title' 필드를 NotificationMessage DTO에 가지고 있고,
                    // RedisStreamPublisher에서 'title'도 Map에 넣었다면 아래와 같이 가져올 수 있습니다.
                    // String title = (String) body.get("title");

                    // NotificationMessage DTO 객체 생성
                    return NotificationMessage.builder()
                            .username(retrievedUsername)
                            .content(content)
                            .type(type)
                            // .title(title) // NotificationMessage에 title이 있다면 추가
                            .build();
                })
                .filter(Objects::nonNull) // 혹시 모를 null 필터링 (위 로직상 null이 나오진 않겠지만 안전하게)
                .collect(Collectors.toList());
    }
}