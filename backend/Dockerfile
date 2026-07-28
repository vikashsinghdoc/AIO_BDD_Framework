# --- Stage 1: build the Spring Boot jar (Gradle, no local install needed) --
FROM gradle:8.10-jdk21 AS build
WORKDIR /app
COPY backend/build.gradle backend/settings.gradle ./
COPY backend/src ./src
RUN gradle bootJar --no-daemon

# --- Stage 2: runtime image with Node.js + Playwright browsers --------------
FROM eclipse-temurin:21-jre-jammy

RUN apt-get update \
    && apt-get install -y --no-install-recommends curl gnupg ca-certificates \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y --no-install-recommends nodejs \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /engine
COPY engine/package.json engine/package-lock.json ./
RUN npm ci
COPY engine/. .
RUN npx playwright install --with-deps chromium firefox webkit

WORKDIR /app
COPY --from=build /app/build/libs/test-orchestrator.jar app.jar

ENV ENGINE_DIR=/engine
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
