FROM maven:3.8-openjdk-17 AS builder
WORKDIR /build
COPY pom.xml .
RUN mvn dependency:go-offline
COPY src ./src
RUN mvn clean package -DskipTests

FROM openjdk:17-slim
WORKDIR /app
COPY --from=builder /build/target/password-hunter-backend-1.0.0.jar .
EXPOSE 8080
CMD ["java", "-jar", "password-hunter-backend-1.0.0.jar"]
