# 빌드 환경
FROM eclipse-temurin:17-jdk-jammy AS build
WORKDIR /app

# 1. Gradle Wrapper & 설정 파일만 먼저 복사
COPY gradlew .
COPY gradle gradle
COPY settings.gradle .

# 각 모듈의 build.gradle 파일만 복사 (의존성 캐싱을 위함)
COPY kong-dic/build.gradle ./kong-dic/
COPY kong-dic-common/build.gradle ./kong-dic-common/
COPY kong-dic-admin/build.gradle ./kong-dic-admin/

# Windows 개행 문자 처리 및 실행 권한 부여
RUN sed -i 's/\r$//' gradlew
RUN chmod +x gradlew

# 2. Gradle 및 의존성 라이브러리 미리 다운로드
# (소스 코드가 없는 상태에서 실행하여 의존성 레이어 캐싱)
RUN ./gradlew :kong-dic:dependencies --no-daemon || true

# 3. 소스 코드 복사 및 빌드
COPY kong-dic/src ./kong-dic/src
COPY kong-dic-common/src ./kong-dic-common/src
COPY kong-dic-admin/src ./kong-dic-admin/src

# 실제 빌드 진행 (이미 의존성이 다운로드되어 있어 매우 빠름)
RUN ./gradlew :kong-dic:bootJar --no-daemon

# 실행 환경
FROM eclipse-temurin:17-jre-jammy
WORKDIR /app
COPY --from=build /app/kong-dic/build/libs/*.jar ./app.jar
ENTRYPOINT ["java", "-jar", "app.jar"]
