package com.hotelshivar.backend.config;

import com.hotelshivar.backend.entity.RestaurantTable;
import com.hotelshivar.backend.repository.RestaurantTableRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

/**
 * Tables used to be a fixed number (app.restaurant.table-count). On the first start with the
 * new tables table, that many tables are created (4 seats each). After that the super admin manages them.
 */
@Component
@Order(2)
@RequiredArgsConstructor
@Slf4j
public class TableSeeder implements CommandLineRunner {

    private final RestaurantTableRepository tableRepository;

    @Value("${app.restaurant.table-count:5}")
    private int tableCount;

    @Override
    public void run(String... args) {
        if (tableRepository.count() > 0) {
            return;
        }
        for (int n = 1; n <= tableCount; n++) {
            tableRepository.save(RestaurantTable.builder().tableNumber(n).capacity(4).build());
        }
        log.info("{} restaurant tables created", tableCount);
    }
}
