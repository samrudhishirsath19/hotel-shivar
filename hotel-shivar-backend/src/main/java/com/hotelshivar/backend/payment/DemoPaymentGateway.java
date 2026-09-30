package com.hotelshivar.backend.payment;

import com.hotelshivar.backend.entity.enums.PaymentMethod;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.security.SecureRandom;

/**
 * Test gateway: no real money moves. A payment succeeds unless the customer asks for a failure
 * ("Simulate failed payment") or uses a UPI id containing "fail" (e.g. fail@upi) - handy for testing.
 * No card numbers are ever sent to or stored by this app.
 */
@Component
public class DemoPaymentGateway implements PaymentGateway {

    private static final String ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
    private static final SecureRandom RANDOM = new SecureRandom();

    @Override
    public String name() {
        return "DEMO";
    }

    @Override
    public Result charge(String orderRef, BigDecimal amount, PaymentMethod method, String payerDetail, boolean forceFailure) {
        String paymentId = "pay_" + random(14);
        boolean fail = forceFailure || (payerDetail != null && payerDetail.toLowerCase().contains("fail"));
        if (fail) {
            return new Result(false, paymentId, null, "Payment declined by the bank. Please try again or choose another method.");
        }
        String ref = switch (method) {
            case UPI -> "UTR" + digits(12);
            case CARD -> "AUTH" + digits(6);
            case NET_BANKING -> "NB" + digits(10);
            default -> "TXN" + digits(10);
        };
        return new Result(true, paymentId, ref, "Payment successful");
    }

    @Override
    public Result refund(String paymentId, BigDecimal amount) {
        return new Result(true, "rfnd_" + random(14), "RFN" + digits(10), "Refund issued to the original payment method");
    }

    public static String random(int n) {
        StringBuilder sb = new StringBuilder(n);
        for (int i = 0; i < n; i++) {
            sb.append(ALPHABET.charAt(RANDOM.nextInt(ALPHABET.length())));
        }
        return sb.toString();
    }

    private static String digits(int n) {
        StringBuilder sb = new StringBuilder(n);
        for (int i = 0; i < n; i++) {
            sb.append(RANDOM.nextInt(10));
        }
        return sb.toString();
    }
}
