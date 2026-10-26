package com.hotelshivar.backend.payment;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hotelshivar.backend.exception.BadRequestException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Duration;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Map;

/**
 * Razorpay (https://razorpay.com/docs/api/) through its REST API: create an order for Checkout, check the
 * payment signature, fetch / capture a payment, refund it, and check webhook signatures.
 * <p>
 * Keys come from RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET (environment) or secrets.properties - never from the code.
 * With no keys set, Razorpay is off and the app keeps its demo gateway.
 */
@Component
@Slf4j
public class RazorpayClient {

    private final String keyId;
    private final String keySecret;
    private final String webhookSecret;
    private final String apiBase;
    private final ObjectMapper json = new ObjectMapper();
    private final HttpClient http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build();

    public RazorpayClient(@Value("${app.razorpay.key-id:}") String keyId,
                          @Value("${app.razorpay.key-secret:}") String keySecret,
                          @Value("${app.razorpay.webhook-secret:}") String webhookSecret,
                          @Value("${app.razorpay.api-base:https://api.razorpay.com/v1}") String apiBase) {
        this.keyId = keyId == null ? "" : keyId.trim();
        this.keySecret = keySecret == null ? "" : keySecret.trim();
        this.webhookSecret = webhookSecret == null ? "" : webhookSecret.trim();
        this.apiBase = apiBase.replaceAll("/+$", "");
        if (enabled()) {
            log.info("Razorpay is ON ({} mode)", this.keyId.startsWith("rzp_live_") ? "LIVE" : "TEST");
        }
    }

    public boolean enabled() {
        return !keyId.isEmpty() && !keySecret.isEmpty();
    }

    /** The public key id (safe to give to the browser for Checkout). */
    public String keyId() {
        return keyId;
    }

    public boolean webhookEnabled() {
        return !webhookSecret.isEmpty();
    }

    public static long toPaise(BigDecimal rupees) {
        return rupees.setScale(2, RoundingMode.HALF_UP).movePointRight(2).longValueExact();
    }

    /** Creates a Razorpay order; returns its id (order_...). */
    public String createOrder(long amountPaise, String receipt, Map<String, String> notes) {
        JsonNode r = call("POST", "/orders", Map.of(
                "amount", amountPaise,
                "currency", "INR",
                "receipt", receipt,
                "notes", notes));
        return r.path("id").asText();
    }

    public JsonNode fetchPayment(String paymentId) {
        return call("GET", "/payments/" + paymentId, null);
    }

    /** Captures an authorized payment (only needed when automatic capture is off in the Razorpay dashboard). */
    public JsonNode capture(String paymentId, long amountPaise) {
        return call("POST", "/payments/" + paymentId + "/capture", Map.of("amount", amountPaise, "currency", "INR"));
    }

    /** Full refund; returns the refund entity (id rfnd_...). */
    public JsonNode refund(String paymentId, long amountPaise) {
        return call("POST", "/payments/" + paymentId + "/refund", Map.of("amount", amountPaise));
    }

    /** Checkout signature: HMAC-SHA256(order_id + "|" + payment_id, key secret). */
    public boolean validCheckoutSignature(String orderId, String paymentId, String signature) {
        return matches(hmac(keySecret, orderId + "|" + paymentId), signature);
    }

    /** Webhook signature: HMAC-SHA256(raw body, webhook secret). */
    public boolean validWebhookSignature(String body, String signature) {
        return webhookEnabled() && matches(hmac(webhookSecret, body), signature);
    }

    // ------------------------------------------------------------------ http

    private JsonNode call(String method, String path, Object body) {
        if (!enabled()) {
            throw new BadRequestException("Online payment is not set up");
        }
        try {
            String auth = Base64.getEncoder().encodeToString((keyId + ":" + keySecret).getBytes(StandardCharsets.UTF_8));
            HttpRequest.Builder req = HttpRequest.newBuilder(URI.create(apiBase + path))
                    .timeout(Duration.ofSeconds(20))
                    .header("Authorization", "Basic " + auth)
                    .header("Content-Type", "application/json");
            req = body == null ? req.GET()
                    : req.method(method, HttpRequest.BodyPublishers.ofString(json.writeValueAsString(body)));
            HttpResponse<String> res = http.send(req.build(), HttpResponse.BodyHandlers.ofString());
            JsonNode node = res.body() == null || res.body().isBlank() ? json.createObjectNode() : json.readTree(res.body());
            if (res.statusCode() / 100 != 2) {
                String why = node.path("error").path("description").asText("Razorpay error " + res.statusCode());
                log.warn("Razorpay {} {} failed: {} {}", method, path, res.statusCode(), why);
                throw new BadRequestException("Payment gateway: " + why);
            }
            return node;
        } catch (BadRequestException e) {
            throw e;
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new BadRequestException("Payment gateway did not answer. Please try again.");
        } catch (Exception e) {
            log.warn("Razorpay {} {} failed: {}", method, path, e.toString());
            throw new BadRequestException("Could not reach the payment gateway. Please try again.");
        }
    }

    private static String hmac(String secret, String data) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            return HexFormat.of().formatHex(mac.doFinal(data.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }

    private static boolean matches(String expected, String given) {
        return given != null && MessageDigest.isEqual(
                expected.getBytes(StandardCharsets.UTF_8), given.trim().toLowerCase().getBytes(StandardCharsets.UTF_8));
    }
}
