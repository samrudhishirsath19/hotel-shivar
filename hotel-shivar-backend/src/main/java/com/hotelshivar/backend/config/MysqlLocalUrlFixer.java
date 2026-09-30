package com.hotelshivar.backend.config;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;

import java.util.HashMap;
import java.util.Map;

/**
 * Fixes "Public Key Retrieval is not allowed" for a MySQL 8 server running on THIS computer.
 * If spring.datasource.url is a jdbc:mysql URL pointing to localhost / 127.0.0.1 and does not
 * already contain allowPublicKeyRetrieval, the option is added when the app starts.
 * Your own application.properties is not changed, and remote databases are left alone.
 * Registered in META-INF/spring.factories.
 */
public class MysqlLocalUrlFixer implements EnvironmentPostProcessor {

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
        String url = environment.getProperty("spring.datasource.url");
        if (url == null || !url.startsWith("jdbc:mysql:")) {
            return;
        }
        boolean local = url.contains("//localhost") || url.contains("//127.0.0.1");
        if (!local || url.contains("allowPublicKeyRetrieval")) {
            return;
        }
        String fixed = url + (url.contains("?") ? "&" : "?") + "allowPublicKeyRetrieval=true";
        Map<String, Object> override = new HashMap<>();
        override.put("spring.datasource.url", fixed);
        environment.getPropertySources().addFirst(new MapPropertySource("hotelShivarMysqlUrlFix", override));
    }
}
