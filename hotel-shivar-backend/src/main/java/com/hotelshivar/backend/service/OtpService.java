package com.hotelshivar.backend.service;

import com.hotelshivar.backend.exception.BadRequestException;
import com.hotelshivar.backend.exception.UnauthorizedException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * One-time passwords for the customer login (mobile number + OTP, like Swiggy / Zomato).
 * A code is 6 digits, valid for 5 minutes and for 5 tries; a number can ask for a new code every 30 seconds
 * and at most 5 times an hour. Codes are kept in memory only (a restart simply means asking for a new one).
 */
@Service
@RequiredArgsConstructor
public class OtpService {

    public static final int RESEND_SECONDS = 30;
    private static final Duration VALID_FOR = Duration.ofMinutes(5);
    private static final int MAX_TRIES = 5;
    private static final int MAX_PER_HOUR = 5;

    private final SmsSender smsSender;
    private final SecureRandom random = new SecureRandom();

    private record Pending(String code, Instant expires, int tries) { }

    private final Map<String, Pending> pending = new ConcurrentHashMap<>();
    private final Map<String, Deque<Instant>> sent = new ConcurrentHashMap<>();

    /** Creates and sends a new code for this number; returns it (shown on screen only in demo mode). */
    public String send(String phone) {
        Instant now = Instant.now();
        Deque<Instant> times = sent.computeIfAbsent(phone, p -> new ArrayDeque<>());
        synchronized (times) {
            while (!times.isEmpty() && times.peekFirst().isBefore(now.minus(Duration.ofHours(1)))) {
                times.pollFirst();
            }
            if (!times.isEmpty()) {
                long wait = RESEND_SECONDS - Duration.between(times.peekLast(), now).getSeconds();
                if (wait > 0) {
                    throw new BadRequestException("Please wait " + wait + " seconds before asking for a new OTP");
                }
            }
            if (times.size() >= MAX_PER_HOUR) {
                throw new BadRequestException("Too many OTP requests for this number. Please try again in an hour.");
            }
            times.addLast(now);
        }
        String code = String.format("%06d", random.nextInt(1_000_000));
        pending.put(phone, new Pending(code, now.plus(VALID_FOR), 0));
        smsSender.send(phone, code + " is your Hotel Shivar login OTP. It is valid for 5 minutes. Do not share it with anyone.");
        return code;
    }

    /** Checks the code; it can be used only once. Throws with the reason when it is wrong / expired. */
    public void verify(String phone, String code) {
        Pending p = pending.get(phone);
        if (p == null || Instant.now().isAfter(p.expires())) {
            pending.remove(phone);
            throw new UnauthorizedException("OTP expired. Please ask for a new one.");
        }
        boolean same = code != null && MessageDigest.isEqual(
                p.code().getBytes(StandardCharsets.UTF_8), code.trim().getBytes(StandardCharsets.UTF_8));
        if (!same) {
            int tries = p.tries() + 1;
            if (tries >= MAX_TRIES) {
                pending.remove(phone);
                throw new UnauthorizedException("Too many wrong attempts. Please ask for a new OTP.");
            }
            pending.put(phone, new Pending(p.code(), p.expires(), tries));
            throw new UnauthorizedException("Wrong OTP. " + (MAX_TRIES - tries) + " attempt(s) left.");
        }
        pending.remove(phone);
    }
}
