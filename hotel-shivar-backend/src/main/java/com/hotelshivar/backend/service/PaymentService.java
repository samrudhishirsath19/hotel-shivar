package com.hotelshivar.backend.service;

import com.hotelshivar.backend.entity.FoodOrder;
import com.hotelshivar.backend.entity.PaymentTransaction;
import com.hotelshivar.backend.entity.enums.PaymentMethod;
import com.hotelshivar.backend.entity.enums.PaymentStatus;
import com.hotelshivar.backend.exception.BadRequestException;
import com.hotelshivar.backend.payment.DemoPaymentGateway;
import com.hotelshivar.backend.payment.PaymentGateway;
import com.hotelshivar.backend.repository.PaymentTransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Payments and refunds of orders. Every attempt (also failed ones) is stored in payment_transactions;
 * the order keeps the current payment status, method, payment id and reference.
 * The caller saves the order.
 */
@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentGateway gateway;
    private final PaymentTransactionRepository transactionRepository;

    public List<PaymentTransaction> history(Long orderId) {
        return transactionRepository.findByOrderIdOrderByCreatedAtAsc(orderId);
    }

    /** Online payment through the gateway. The order becomes PAID or FAILED. */
    @Transactional
    public PaymentGateway.Result payOnline(FoodOrder order, PaymentMethod method, String upiId, boolean forceFailure) {
        if (!method.isOnline()) {
            throw new BadRequestException("Choose UPI, card, net banking or wallet to pay online");
        }
        String payer = null;
        if (method == PaymentMethod.UPI) {
            payer = upiId == null ? "" : upiId.trim();
            if (!payer.matches("[A-Za-z0-9._-]{2,}@[A-Za-z]{2,}")) {
                throw new BadRequestException("Enter a valid UPI id, e.g. name@okaxis");
            }
        }
        PaymentGateway.Result r = gateway.charge("order_" + order.getId(), order.getAmountPayable(), method, payer, forceFailure);

        transactionRepository.save(PaymentTransaction.builder()
                .orderId(order.getId())
                .paymentId(r.paymentId())
                .kind(PaymentTransaction.Kind.PAYMENT)
                .method(method)
                .result(r.success() ? PaymentTransaction.Result.SUCCESS : PaymentTransaction.Result.FAILED)
                .amount(order.getAmountPayable())
                .gateway(gateway.name())
                .transactionRef(r.transactionRef())
                .payerDetail(mask(payer))
                .message(r.message())
                .build());

        order.setPaymentMethod(method);
        order.setPaymentId(r.paymentId());
        order.setPaymentRef(r.transactionRef());
        order.setPaymentStatus(r.success() ? PaymentStatus.PAID : PaymentStatus.FAILED);
        order.setPaymentUpdatedAt(LocalDateTime.now());
        return r;
    }

    /** Money taken by staff: at the billing desk, or cash collected on delivery. */
    @Transactional
    public void recordCounterPayment(FoodOrder order, PaymentMethod method, String reference) {
        PaymentMethod m = method != null ? method : PaymentMethod.CASH;
        boolean cod = m == PaymentMethod.CASH_ON_DELIVERY;
        String paymentId = "pay_" + DemoPaymentGateway.random(14);
        String ref = reference != null && !reference.isBlank()
                ? reference.trim()
                : "RCPT" + order.getId() + "-" + DemoPaymentGateway.random(6).toUpperCase();
        transactionRepository.save(PaymentTransaction.builder()
                .orderId(order.getId())
                .paymentId(paymentId)
                .kind(PaymentTransaction.Kind.PAYMENT)
                .method(m)
                .result(PaymentTransaction.Result.SUCCESS)
                .amount(order.getAmountPayable())
                .gateway(cod ? "COD" : "COUNTER")
                .transactionRef(ref)
                .message(cod ? "Cash collected on delivery" : "Paid at the billing desk")
                .build());
        order.setPaymentMethod(m);
        order.setPaymentId(paymentId);
        order.setPaymentRef(ref);
        order.setPaymentStatus(PaymentStatus.PAID);
        order.setPaymentUpdatedAt(LocalDateTime.now());
    }

    /** Gives the money back for a paid order (a paid order that is cancelled). Does nothing if not paid. */
    @Transactional
    public void refund(FoodOrder order, String reason) {
        if (order.getPaymentStatus() != PaymentStatus.PAID) {
            return;
        }
        boolean online = order.getPaymentMethod() != null && order.getPaymentMethod().isOnline();
        PaymentGateway.Result r = online
                ? gateway.refund(order.getPaymentId(), order.getAmountPayable())
                : new PaymentGateway.Result(true, "rfnd_" + DemoPaymentGateway.random(14),
                        "CASHREFUND-" + order.getId(), "Cash refunded at the counter");
        transactionRepository.save(PaymentTransaction.builder()
                .orderId(order.getId())
                .paymentId(r.paymentId())
                .kind(PaymentTransaction.Kind.REFUND)
                .method(order.getPaymentMethod() != null ? order.getPaymentMethod() : PaymentMethod.CASH)
                .result(PaymentTransaction.Result.SUCCESS)
                .amount(order.getAmountPayable())
                .gateway(online ? gateway.name() : "COUNTER")
                .transactionRef(r.transactionRef())
                .message(reason != null ? reason : r.message())
                .build());
        order.setPaymentStatus(PaymentStatus.REFUNDED);
        order.setPaymentRef(r.transactionRef());
        order.setPaymentUpdatedAt(LocalDateTime.now());
    }

    /** ra****@okaxis */
    static String mask(String upi) {
        if (upi == null || upi.isEmpty()) {
            return null;
        }
        int at = upi.indexOf('@');
        if (at <= 0) {
            return "****";
        }
        String name = upi.substring(0, at);
        return (name.length() <= 2 ? name.charAt(0) + "*" : name.substring(0, 2) + "****") + upi.substring(at);
    }
}
