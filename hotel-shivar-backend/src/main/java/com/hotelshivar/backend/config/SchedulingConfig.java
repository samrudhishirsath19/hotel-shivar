package com.hotelshivar.backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;

/** Turns on @Scheduled jobs (e.g. taking back delivery orders that were not accepted in time). */
@Configuration
@EnableScheduling
public class SchedulingConfig {
}
