package com.hotelshivar.backend.service;

import org.springframework.stereotype.Service;

import java.util.concurrent.ConcurrentHashMap;

/**
 * Very small in-memory brute-force guard: 5 wrong passwords for the same email
 * locks that email for 15 minutes. Resets when the server restarts.
 */
@Service
public class LoginAttemptService {

    private static final int MAX_ATTEMPTS = 5;
    private static final long LOCK_MILLIS = 15L * 60L * 1000L;

    private record Attempt(int count, long lockedUntil) { }

    private final ConcurrentHashMap<String, Attempt> attempts = new ConcurrentHashMap<>();

    public boolean isLocked(String email) {
        Attempt a = attempts.get(key(email));
        if (a == null) return false;
        if (a.lockedUntil() > System.currentTimeMillis()) return true;
        if (a.lockedUntil() != 0) attempts.remove(key(email)); // lock expired
        return false;
    }

    public void recordFailure(String email) {
        attempts.compute(key(email), (k, old) -> {
            int count = (old == null ? 0 : old.count()) + 1;
            long lockedUntil = count >= MAX_ATTEMPTS ? System.currentTimeMillis() + LOCK_MILLIS : 0L;
            return new Attempt(count, lockedUntil);
        });
    }

    public void recordSuccess(String email) {
        attempts.remove(key(email));
    }

    private static String key(String email) {
        return email == null ? "" : email.trim().toLowerCase();
    }
}
