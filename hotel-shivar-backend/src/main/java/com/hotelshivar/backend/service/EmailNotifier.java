package com.hotelshivar.backend.service;

import com.hotelshivar.backend.dto.EmailDetails;
import com.hotelshivar.backend.entity.Booking;
import com.hotelshivar.backend.entity.CustomerAccount;
import com.hotelshivar.backend.entity.FoodOrder;
import com.hotelshivar.backend.entity.PaymentTransaction;
import com.hotelshivar.backend.entity.enums.PaymentMethod;
import com.hotelshivar.backend.repository.CustomerAccountRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

/**
 * Where the services hand over "this happened, email the guest". It copies what the email needs (while the
 * database session is open), finds the address, and asks {@link EmailService} to send it only AFTER the
 * transaction has committed - a booking that fails and rolls back never sends a confirmation.
 * Nothing in here ever throws to the caller: an email problem can never break a booking, order or payment.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class EmailNotifier {

    private final EmailService email;
    private final CustomerAccountRepository customers;

    public void welcome(CustomerAccount c) {
        safely("welcome", () -> {
            String to = c.getEmail(), name = c.getName();
            afterCommit(() -> email.sendWelcomeEmail(to, name));
        });
    }

    public void passwordReset(CustomerAccount c, String otp, String token, int otpMinutes, int linkMinutes) {
        safely("password reset", () -> {
            String to = c.getEmail(), name = c.getName();
            String link = email.siteUrl() + "/reset-password?token=" + token;
            afterCommit(() -> email.sendPasswordResetEmail(to, name, otp, link, otpMinutes, linkMinutes));
        });
    }

    public void bookingPlaced(Booking b) {
        safely("booking confirmation", () -> {
            var room = b.getRoom();
            int nights = b.getNights() != null ? b.getNights()
                    : (int) Math.max(1, ChronoUnit.DAYS.between(b.getCheckIn(), b.getCheckOut()));
            var d = new EmailDetails.Booking(b.getEmail(), b.getGuestName(), b.getId(),
                    room.getName() != null ? room.getName() : "Room " + room.getRoomNumber(), nice(room.getType()),
                    b.getCheckIn(), b.getCheckOut(), nights, b.getNumberOfGuests(),
                    b.getRoomCharges(), b.getOfferTitle(), b.getDiscountAmount(), b.getTaxAmount(), b.getAmountPayable(),
                    nice(b.getStatus()), link("/booking/", b.getTrackingCode()));
            afterCommit(() -> email.sendBookingConfirmation(d));
        });
    }

    public void orderPlaced(FoodOrder o) {
        safely("order confirmation", () -> {
            String to = emailOf(o);
            if (to == null) {
                return; // guest order without an account: no email address
            }
            List<EmailDetails.Line> lines = o.getLines().stream()
                    .map(l -> new EmailDetails.Line(l.getName(), l.getQuantity(), l.getUnitPrice(),
                            l.getUnitPrice().multiply(BigDecimal.valueOf(l.getQuantity()))))
                    .toList();
            var d = new EmailDetails.Order(to, o.getCustomerName(), o.getId(), lines, o.getTotal(),
                    o.getOfferTitle(), o.getDiscountAmount(), o.getTaxAmount(), o.getAmountPayable(),
                    nice(o.getPaymentMethod()), o.getDeliveryAddress(), link("/order/", o.getTrackingCode()));
            afterCommit(() -> email.sendOrderConfirmation(d));
        });
    }

    /** A successful payment (online, at the billing desk, or cash on delivery). */
    public void paymentReceived(FoodOrder o, PaymentTransaction t) {
        safely("payment receipt", () -> {
            String to = emailOf(o);
            if (to == null || t.getResult() != PaymentTransaction.Result.SUCCESS) {
                return;
            }
            var d = new EmailDetails.Receipt(to, o.getCustomerName(), o.getId(), t.getPaymentId(), t.getTransactionRef(),
                    t.getAmount(), t.getCreatedAt(), nice(t.getMethod()), "SUCCESS", link("/order/", o.getTrackingCode()));
            afterCommit(() -> email.sendPaymentReceipt(d));
        });
    }

    /** Room bookings are paid at the hotel, so there is no refund to show. */
    public void bookingCancelled(Booking b) {
        safely("booking cancellation", () -> {
            var d = new EmailDetails.Cancellation(b.getEmail(), b.getGuestName(), "Booking", b.getId(), LocalDateTime.now(),
                    null, null, null, null);
            afterCommit(() -> email.sendCancellationConfirmation(d));
        });
    }

    /** refund = the refund made for the cancelled order, or null when it was not paid. */
    public void orderCancelled(FoodOrder o, PaymentTransaction refund) {
        safely("order cancellation", () -> {
            String to = emailOf(o);
            if (to == null) {
                return;
            }
            EmailDetails.Cancellation d;
            if (refund == null) {
                d = new EmailDetails.Cancellation(to, o.getCustomerName(), "Order", o.getId(), LocalDateTime.now(),
                        null, null, null, null);
            } else {
                String note = "RAZORPAY".equals(refund.getGateway())
                        ? "Refunded through Razorpay to the account you paid from. It usually reaches you in 5-7 working days."
                        : refund.getMethod() != null && refund.getMethod().isOnline()
                        ? "Refunded to the account you paid from."
                        : "Refunded in cash at the hotel.";
                d = new EmailDetails.Cancellation(to, o.getCustomerName(), "Order", o.getId(), LocalDateTime.now(),
                        refund.getAmount(), refund.getPaymentId(), nice(refund.getMethod()), note);
            }
            var mail = d;
            afterCommit(() -> email.sendCancellationConfirmation(mail));
        });
    }

    // ------------------------------------------------------------------ helpers

    /** Online orders keep no email of their own: it comes from the customer account that placed it. */
    private String emailOf(FoodOrder o) {
        if (o.getCustomerId() == null) {
            return null;
        }
        return customers.findById(o.getCustomerId()).map(CustomerAccount::getEmail).orElse(null);
    }

    private String link(String path, String code) {
        return code == null ? null : email.siteUrl() + path + code;
    }

    /** CASH_ON_DELIVERY -> Cash on delivery */
    static String nice(Enum<?> e) {
        if (e == null) {
            return null;
        }
        if (e == PaymentMethod.UPI) {
            return "UPI";
        }
        String s = e.name().replace('_', ' ').toLowerCase();
        return Character.toUpperCase(s.charAt(0)) + s.substring(1);
    }

    /** Runs the email after the current transaction commits (straight away when there is none). */
    private static void afterCommit(Runnable send) {
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    safely("after commit", send);
                }
            });
        } else {
            send.run();
        }
    }

    private static void safely(String what, Runnable r) {
        try {
            r.run();
        } catch (Exception e) {
            log.error("Could not prepare the {} email: {}", what, e.toString());
        }
    }
}
