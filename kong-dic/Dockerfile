# 빌드 환경
FROM eclipse-temurin:17-jdk-jammy AS build
WORKDIR /app

# Gradle Wrapper & 설정
COPY gradlew .
COPY gradle gradle
COPY settings.gradle .

# 모든 모듈 복사
COPY kong-dic ./kong-dic
COPY kong-dic-admin ./kong-dic-admin
COPY kong-dic-common ./kong-dic-common

# 실행 권한 부여
RUN chmod +x gradlew

# 멀티모듈 빌드 (kong-dic 모듈만)
RUN ./gradlew :kong-dic:bootJar --no-daemon

# 실행 환경
FROM eclipse-temurin:17-jre-jammy
WORKDIR /app
COPY --from=build /app/kong-dic/build/libs/*.jar ./app.jar
ENTRYPOINT ["java", "-jar", "app.jar"]
