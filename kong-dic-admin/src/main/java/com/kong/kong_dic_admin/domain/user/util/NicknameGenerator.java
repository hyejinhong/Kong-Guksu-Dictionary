package com.kong.kong_dic_admin.domain.user.util;

import java.util.List;
import java.util.Random;

public class NicknameGenerator {

    private static final List<String> adjectives = List.of(
            "민트초코", "크림치즈", "와사비", "딸기잼", "탄산", "초콜릿", "버터", "메로나", "카라멜", "두리안"
    );

    private static final List<String> foods = List.of(
            "김치찌개", "딤섬", "삼겹살", "볶음밥", "치즈피자", "감자탕", "순대국", "스파게티", "회덮밥", "탕수육"
    );

    private static final Random random = new Random();

    public static String generate() {
        String adjective = adjectives.get(random.nextInt(adjectives.size()));
        String food = foods.get(random.nextInt(foods.size()));
        return adjective + " " + food;
    }
}
