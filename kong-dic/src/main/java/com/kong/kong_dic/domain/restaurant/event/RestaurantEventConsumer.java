package com.kong.kong_dic.domain.restaurant.event;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.kong.kong_dic.common.event.RestaurantApprovedEvent;
import com.kong.kong_dic.domain.restaurant.entity.Restaurant;
import com.kong.kong_dic.domain.restaurant.repository.RestaurantRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.connection.stream.MapRecord;
import org.springframework.data.redis.connection.stream.StreamOffset;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;


@Slf4j
@Component
@RequiredArgsConstructor
public class RestaurantEventConsumer {

    private static final String STREAM_KEY = "restaurant.approved";

    private final RedisTemplate<String, String> redisTemplate;
    private final RestaurantRepository restaurantRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @PostConstruct
    public void listen() {
        new Thread(this::consume).start(); // 별도 스레드에서 계속 읽기
    }

    private void consume() {
        log.info("### RestaurantEventConsumer started listening to stream: {}", STREAM_KEY);

        while (true) {
            try {
                List<MapRecord<String, Object, Object>> messages =
                        redisTemplate.opsForStream().read(
                                StreamOffset.fromStart(STREAM_KEY) // 처음부터 읽기, 운영에선 lastConsumed 추천
                        );

                if (messages == null || messages.isEmpty()) {
                    Thread.sleep(2000);
                    continue;
                }

                for (MapRecord<String, Object, Object> message : messages) {
                    Map<Object, Object> value = message.getValue();
                    String payloadJson = (String) value.get("data");

                    log.info("### Received restaurant.approved event: {}", payloadJson);

                    // payload → DTO 변환
                    RestaurantApprovedEvent event =
                            objectMapper.readValue(payloadJson, RestaurantApprovedEvent.class);

                    // DB 저장
                    Restaurant restaurant = Restaurant.builder()
                            .name(event.getName())
                            .address(event.getAddress())
                            .latitude(event.getLatitude())
                            .longitude(event.getLongitude())
                            .prices(event.getPrices()) // List<BeanPrice>라고 가정
                            .servesAllYear(event.getServesAllYear())
                            .startMonth(event.getStartMonth())
                            .endMonth(event.getEndMonth())
                            .build();

                    restaurantRepository.save(restaurant);

                    log.info("### Saved Restaurant entity id={}", restaurant.getId());
                }

            } catch (Exception e) {
                log.error("### Error while consuming restaurant.approved", e);
            }
        }
    }
}