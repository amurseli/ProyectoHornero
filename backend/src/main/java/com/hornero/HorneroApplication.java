package com.hornero;

import jakarta.annotation.PostConstruct;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.util.TimeZone;

@SpringBootApplication
public class HorneroApplication {

    // Los timestamps se guardan en hora local de Argentina. Fijamos la zona de la JVM para que
    // LocalDateTime.now() use siempre America/Argentina/Buenos_Aires, sin depender de la zona
    // del contenedor donde se despliegue. La API luego serializa estos valores a UTC.
    @PostConstruct
    public void init() {
        TimeZone.setDefault(TimeZone.getTimeZone("America/Argentina/Buenos_Aires"));
    }

    public static void main(String[] args) {
        SpringApplication.run(HorneroApplication.class, args);
    }
}