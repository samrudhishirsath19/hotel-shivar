package com.hotelshivar.backend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

/**
 * Allows the Vite React frontend (running on a different port) to call this API.
 * Any port on localhost / 127.0.0.1 is allowed, because Vite moves to 5174, 5175, ... when 5173 is
 * already taken - with only 5173 allowed, the browser blocked every call and the login page showed
 * "Cannot reach the server". Add your production frontend address in app.cors.allowed-origins.
 */
@Configuration
public class CorsConfig implements WebMvcConfigurer {

    /** Extra allowed origins, comma separated, e.g. https://hotelshivar.com */
    @Value("${app.cors.allowed-origins:}")
    private String extraOrigins;

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        List<String> origins = new ArrayList<>(List.of("http://localhost:*", "http://127.0.0.1:*", "http://[::1]:*"));
        Arrays.stream(extraOrigins.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .forEach(origins::add);
        registry.addMapping("/api/**")
                .allowedOriginPatterns(origins.toArray(String[]::new))
                .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true);
    }
}
