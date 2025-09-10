# 빌드 환경
FROM eclipse-temurin:17-jdk-jammy AS build

WORKDIR /app

# 루트 gradlew, gradle-wrapper, settings.gradle 복사
COPY gradlew .
COPY gradle gradle
COPY settings.gradle .

# kong-dic 모듈만 복사
COPY kong-dic/build.gradle .
COPY kong-dic/src src

# 멀티모듈 빌드 시 :kong-dic:bootJar 실행
RUN ./gradlew :kong-dic:bootJar

# 실행 환경
FROM eclipse-temurin:17-jre-jammy
WORKDIR /app
COPY --from=build /app/kong-dic/build/libs/*.jar ./app.jar
ENTRYPOINT ["java", "-jar", "app.jar"]
