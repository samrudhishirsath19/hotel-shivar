package com.hotelshivar.backend.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * Sends a text message to an Indian mobile number (10 digits). The default only writes it to the server log;
 * to send real SMS, add a class that calls your SMS provider (MSG91, Twilio, Fast2SMS ...) and mark it @Primary.
 */
public interface SmsSender {

    void send(String phone, String text);

    @Component
    @Slf4j
    class LogOnly implements SmsSender {
        @Override
        public void send(String phone, String text) {
            log.info("SMS to ******{}: {}", phone.substring(Math.max(0, phone.length() - 4)), text);
        }
    }
}
