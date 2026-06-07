# Stage 1: Build
FROM maven:3.8.4-openjdk-17 AS builder
WORKDIR /app

# Copiar pom.xml y descargar dependencias (para aprovechar cache de Docker)
COPY pom.xml .
RUN mvn dependency:go-offline

# Copiar código fuente y compilar
COPY src ./src
RUN mvn clean package -DskipTests

# Stage 2: Runtime
FROM eclipse-temurin:17-jre
ENV TZ=America/Argentina/Buenos_Aires
WORKDIR /app

# Copiar JAR desde stage anterior
COPY --from=builder /app/target/*.jar app.jar

# Exponer puerto
EXPOSE 8083

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:8083/actuator/health || exit 1

# Ejecutar aplicación
ENTRYPOINT ["java", "-jar", "app.jar"]
