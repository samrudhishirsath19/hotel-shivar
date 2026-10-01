package com.hotelshivar.backend.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * One-time repair for an EXISTING MySQL database. Hibernate's ddl-auto=update never changes a column
 * that already exists, so an old rooms table can keep two things that make "Add room" fail:
 *   - rooms.type as an ENUM that does not contain newer room types (error: Data truncated for column 'type')
 *   - rooms.image_url as varchar(255) (error: Data too long for column 'image_url')
 * This widens both. Safe to run on every start; it does nothing if already fixed, and on H2 it is skipped.
 */
@Component
@Order(0)
@RequiredArgsConstructor
@Slf4j
public class SchemaFixer implements CommandLineRunner {

    private final JdbcTemplate jdbc;

    @Override
    public void run(String... args) {
        String product;
        try {
            product = jdbc.execute((java.sql.Connection c) -> c.getMetaData().getDatabaseProductName());
        } catch (Exception e) {
            return;
        }
        if (product == null || !product.toLowerCase().contains("mysql")) {
            return;
        }
        exec("ALTER TABLE rooms MODIFY COLUMN type VARCHAR(30) NOT NULL");
        exec("ALTER TABLE rooms MODIFY COLUMN image_url VARCHAR(1000) NULL");
    }

    private void exec(String sql) {
        try {
            jdbc.execute(sql);
        } catch (Exception e) {
            log.warn("Schema check skipped ({}): {}", sql, e.getMessage());
        }
    }
}
