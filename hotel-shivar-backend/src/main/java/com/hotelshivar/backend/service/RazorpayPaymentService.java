package com.hotelshivar.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hotelshivar.backend.dto.TrackResponse;
import com.hotelshivar.backend.entity.FoodOrder;
import com.hotelshivar.backend.entity.enums.OrderStatus;
import com.hotelshivar.backend.entity.enums.PaymentMethod;
import com.hotelshivar.backend.entity.enums.PaymentStatus;
import com.hotelshivar.backend.exception.BadRequestException;
import com.hotelshivar.backend.exception.ResourceNotFoundException;
import com.hotelshivar.backend.payment.RazorpayClient;
import com.hotelshivar.backend.repository.FoodOrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Online orders paid with Razorpay Checkout:
 * 1. start   - a Razorpay order is created for the amount to pay (incl. GST) and Checkout opens in the browser;
 * 2. verify  - after paying, the browser sends the payment id + signature; the signature is checked and the
 *              payment is fetched from Razorpay (status and amount) before the order is marked PAID;
 * 3. webhook - Razorpay also tells the server directly (payment.captured / payment.failed), so a payment
 *              is not lost when the customer closes the browser before step 2.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class RazorpayPaymentService {

    private final RazorpayClient razorpay;
    private final FoodOrderRepository orderRepository;
    private final PaymentService paymentService;
    private final ObjectMapper json = new ObjectMapper();

    /** For the website: is Razorpay on, and the public key for Checkout. */
    public Map<String, Object> config() {
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("razorpay", razorpay.enabled());
        if (razorpay.enabled()) {
            out.put("keyId", razorpay.keyId());
        }
        return out;
    }

    /** Step 1: Razorpay order for this food order (made again if the amount changed). */
    @Transactional
    public Map<String, Object> start(String trackingCode) {
        FoodOrder o = payable(trackingCode);
        long paise = RazorpayClient.toPaise(o.getAmountPayable());
        if (paise < 100) {
            throw new BadRequestException("The amount is too small to pay online");
        }
        if (o.getGatewayOrderId() == null || o.getGatewayAmountPaise() == null || o.getGatewayAmountPaise() != paise) {
            Map<String, String> notes = new LinkedHashMap<>();
            notes.put("hotel_order_id", String.valueOf(o.getId()));
            notes.put("tracking_code", o.getTrackingCode());
            o.setGatewayOrderId(razorpay.createOrder(paise, "HS-" + o.getId(), notes));
            o.setGatewayAmountPaise(paise);
            orderRepository.save(o);
        }
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("keyId", razorpay.keyId());
        out.put("orderId", o.getGatewayOrderId());
        out.put("amount", paise);
        out.put("currency", "INR");
        out.put("name", "Hotel Shivar");
        out.put("description", "Food order #" + o.getId());
        out.put("customerName", o.getCustomerName());
        out.put("customerPhone", o.getCustomerPhone());
        return out;
    }

    /** Step 2: the browser reports a successful payment. Checked with Razorpay before the order counts as paid. */
    @Transactional
    public TrackResponse verify(String trackingCode, String rzpOrderId, String paymentId, String signature) {
        FoodOrder o = byCode(trackingCode);
        if (o.getPaymentStatus() == PaymentStatus.PAID) {
            return paymentService.track(o); // already confirmed (e.g. by the webhook)
        }
        if (o.getGatewayOrderId() == null || !o.getGatewayOrderId().equals(rzpOrderId)) {
            throw new BadRequestException("This payment does not belong to this order");
        }
        if (paymentId == null || !razorpay.validCheckoutSignature(rzpOrderId, paymentId, signature)) {
            log.warn("Razorpay signature mismatch for order {}", o.getId());
            throw new BadRequestException("Payment could not be verified. If money was taken, it will be refunded automatically by Razorpay.");
        }
        settle(o, razorpay.fetchPayment(paymentId));
        orderRepository.save(o);
        return paymentService.track(o);
    }

    /** The customer's payment failed / was cancelled in Checkout: keep the failed attempt in the history. */
    @Transactional
    public TrackResponse failed(String trackingCode, String paymentId, String reason) {
        FoodOrder o = byCode(trackingCode);
        if (o.getPaymentStatus() != PaymentStatus.PAID && paymentId != null && !paymentId.isBlank()) {
            paymentService.recordGatewayResult(o, false, PaymentMethod.UPI, paymentId.trim(), null, null,
                    reason == null || reason.isBlank() ? "Payment failed" : trim(reason, 280), "RAZORPAY");
            orderRepository.save(o);
        }
        return paymentService.track(o);
    }

    /** Step 3: webhook from Razorpay (signature already checked by the controller). */
    @Transactional
    public void webhook(String body) {
        try {
            JsonNode root = json.readTree(body);
            String event = root.path("event").asText();
            JsonNode payment = root.path("payload").path("payment").path("entity");
            String rzpOrderId = payment.path("order_id").asText("");
            if (rzpOrderId.isEmpty()) {
                return;
            }
            FoodOrder o = orderRepository.findByGatewayOrderId(rzpOrderId).orElse(null);
            if (o == null || o.getPaymentStatus() == PaymentStatus.PAID) {
                return;
            }
            if ("payment.captured".equals(event) || "order.paid".equals(event)) {
                settle(o, payment);
                orderRepository.save(o);
            } else if ("payment.failed".equals(event)) {
                paymentService.recordGatewayResult(o, false, method(payment), payment.path("id").asText(), null, payer(payment),
                        trim(payment.path("error_description").asText("Payment failed"), 280), "RAZORPAY");
                orderRepository.save(o);
            }
        } catch (BadRequestException e) {
            log.warn("Razorpay webhook not applied: {}", e.getMessage());
        } catch (Exception e) {
            log.warn("Razorpay webhook could not be read: {}", e.toString());
        }
    }

    // ------------------------------------------------------------------ helpers

    /** Checks the payment Razorpay reports (right order, full amount, captured) and marks the order paid. */
    private void settle(FoodOrder o, JsonNode p) {
        String paymentId = p.path("id").asText();
        if (!o.getGatewayOrderId().equals(p.path("order_id").asText())) {
            throw new BadRequestException("This payment does not belong to this order");
        }
        long expected = o.getGatewayAmountPaise() != null ? o.getGatewayAmountPaise() : RazorpayClient.toPaise(o.getAmountPayable());
        if (p.path("amount").asLong() != expected) {
            throw new BadRequestException("Paid amount does not match the order. Please contact the hotel.");
        }
        String status = p.path("status").asText();
        if ("authorized".equals(status)) {
            p = razorpay.capture(paymentId, expected); // automatic capture is off in the dashboard
            status = p.path("status").asText();
        }
        if (!"captured".equals(status)) {
            throw new BadRequestException("Payment is not complete yet (" + status + "). Please try again.");
        }
        String ref = firstText(p.path("acquirer_data"), "rrn", "upi_transaction_id", "bank_transaction_id", "auth_code");
        paymentService.recordGatewayResult(o, true, method(p), paymentId, ref, payer(p), "Payment successful", "RAZORPAY");
    }

    private FoodOrder payable(String trackingCode) {
        FoodOrder o = byCode(trackingCode);
        if (o.getStatus() == OrderStatus.CANCELLED) {
            throw new BadRequestException("This order was cancelled");
        }
        if (o.getPaymentStatus() == PaymentStatus.PAID) {
            throw new BadRequestException("This order is already paid");
        }
        if (o.getStatus() != OrderStatus.PENDING) {
            throw new BadRequestException("This order can no longer be paid online");
        }
        return o;
    }

    private FoodOrder byCode(String code) {
        return orderRepository.findByTrackingCode(code == null ? "" : code.trim())
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));
    }

    private static PaymentMethod method(JsonNode p) {
        return switch (p.path("method").asText("")) {
            case "card", "emi", "cardless_emi", "paylater" -> PaymentMethod.CARD;
            case "netbanking" -> PaymentMethod.NET_BANKING;
            case "wallet" -> PaymentMethod.WALLET;
            default -> PaymentMethod.UPI;
        };
    }

    /** What the customer paid with, shown masked: UPI id, bank, wallet or card network + last 4 digits. */
    private static String payer(JsonNode p) {
        if (p.hasNonNull("vpa")) return PaymentService.mask(p.path("vpa").asText());
        if (p.path("card").hasNonNull("last4")) return p.path("card").path("network").asText("Card") + " ****" + p.path("card").path("last4").asText();
        if (p.hasNonNull("bank")) return p.path("bank").asText();
        if (p.hasNonNull("wallet")) return p.path("wallet").asText();
        return null;
    }

    private static String firstText(JsonNode node, String... names) {
        for (String n : names) {
            if (node.hasNonNull(n) && !node.path(n).asText().isBlank()) {
                return node.path(n).asText();
            }
        }
        return null;
    }

    private static String trim(String s, int max) {
        return s.length() > max ? s.substring(0, max) : s;
    }
}
