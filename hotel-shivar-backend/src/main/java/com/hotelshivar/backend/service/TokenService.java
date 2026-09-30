package com.hotelshivar.backend.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hotelshivar.backend.entity.AdminUser;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;

/**
 * Issues and verifies signed login tokens (standard JWT layout, HS256).
 * Built on the JDK only, so no extra library is needed.
 */
@Service
public class TokenService {

    private static final String HEADER_JSON = "{\"alg\":\"HS256\",\"typ\":\"JWT\"}";

    /** What we read back out of a valid token. */
    public record TokenClaims(String email, String name, String role, long expiresAt) { }

    private final ObjectMapper mapper = new ObjectMapper();
    private final byte[] secret;
    private final long expiryMillis;

    public TokenService(@Value("${app.auth.jwt-secret}") String secret,
                        @Value("${app.auth.token-hours:8}") long tokenHours) {
        if (secret == null || secret.length() < 32) {
            throw new IllegalStateException("app.auth.jwt-secret must be at least 32 characters long");
        }
        this.secret = secret.getBytes(StandardCharsets.UTF_8);
        this.expiryMillis = tokenHours * 60L * 60L * 1000L;
    }

    public long expiryFromNow() {
        return System.currentTimeMillis() + expiryMillis;
    }

    public String createToken(AdminUser user, long expiresAt) {
        try {
            Map<String, Object> payload = new LinkedHashMap<>();
            payload.put("sub", user.getEmail());
            payload.put("name", user.getName());
            payload.put("role", user.getRole());
            payload.put("exp", expiresAt);

            String head = b64(HEADER_JSON.getBytes(StandardCharsets.UTF_8));
            String body = b64(mapper.writeValueAsBytes(payload));
            String unsigned = head + "." + body;
            return unsigned + "." + b64(sign(unsigned));
        } catch (Exception e) {
            throw new IllegalStateException("Could not create token", e);
        }
    }

    /** Returns the claims if the token is genuine and not expired, otherwise empty. */
    public Optional<TokenClaims> verify(String token) {
        try {
            if (token == null) return Optional.empty();
            String[] parts = token.split("\\.");
            if (parts.length != 3) return Optional.empty();

            byte[] expected = sign(parts[0] + "." + parts[1]);
            byte[] actual = Base64.getUrlDecoder().decode(parts[2]);
            if (!MessageDigest.isEqual(expected, actual)) return Optional.empty();

            Map<String, Object> payload = mapper.readValue(
                    Base64.getUrlDecoder().decode(parts[1]), new TypeReference<Map<String, Object>>() { });

            long exp = ((Number) payload.get("exp")).longValue();
            if (exp < System.currentTimeMillis()) return Optional.empty();

            return Optional.of(new TokenClaims(
                    (String) payload.get("sub"),
                    (String) payload.get("name"),
                    (String) payload.get("role"),
                    exp));
        } catch (Exception e) {
            return Optional.empty();
        }
    }

    private byte[] sign(String data) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(secret, "HmacSHA256"));
        return mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
    }

    private static String b64(byte[] bytes) {
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }
}
