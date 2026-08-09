# ---- Build stage ----
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml ./
RUN mvn -q dependency:go-offline
COPY src ./src
RUN mvn -q package -DskipTests

# ---- Runtime stage ----
FROM eclipse-temurin:21-jre
WORKDIR /app
RUN useradd -r -u 1001 spring
COPY --from=build /app/target/*.jar app.jar
# Pre-create with spring:spring ownership before the volume mount - a fresh named volume
# mounted at a path that already exists in the image inherits that path's ownership, but
# one mounted at a path Spring itself creates at runtime (as the non-root spring user) would
# come up root-owned and unwritable.
RUN mkdir -p /app/documents && chown -R spring:spring /app/documents
USER spring
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
