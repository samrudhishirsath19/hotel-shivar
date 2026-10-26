package com.hotelshivar.backend.controller;

import com.hotelshivar.backend.payment.RazorpayClient;
import com.hotelshivar.backend.service.RazorpayPaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/** Payment settings for the website, and the Razorpay webhook. */
@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final RazorpayPaymentService razorpayPayments;
    private final RazorpayClient razorpay;

    /** Public: is Razorpay on (and its public key id for Checkout). Never the secret. */
    @GetMapping("/config")
    public Map<String, Object> config() {
        return razorpayPayments.config();
    }

    /**
     * Razorpay webhook (set it up in Razorpay Dashboard -> Webhooks with events payment.captured and payment.failed).
     * Only accepted with a valid X-Razorpay-Signature made with the webhook secret.
     */
    @PostMapping("/razorpay/webhook")
    public ResponseEntity<Void> webhook(@RequestBody String body,
                                        @RequestHeader(value = "X-Razorpay-Signature", required = false) String signature) {
        if (!razorpay.validWebhookSignature(body, signature)) {
            return ResponseEntity.status(400).build();
        }
        razorpayPayments.webhook(body);
        return ResponseEntity.ok().build();
    }
}
