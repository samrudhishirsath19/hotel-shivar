package com.hotelshivar.backend.service;

import com.hotelshivar.backend.dto.CustomerLoginRequest;
import com.hotelshivar.backend.dto.CustomerRegisterRequest;
import com.hotelshivar.backend.entity.Booking;
import com.hotelshivar.backend.entity.CustomerAccount;
import com.hotelshivar.backend.entity.FoodOrder;
import com.hotelshivar.backend.exception.BadRequestException;
import com.hotelshivar.backend.exception.ResourceNotFoundException;
import com.hotelshivar.backend.exception.UnauthorizedException;
import com.hotelshivar.backend.repository.BookingRepository;
import com.hotelshivar.backend.repository.CustomerAccountRepository;
import com.hotelshivar.backend.repository.FoodOrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;

/** Customer accounts on the website: sign up, log in, and see / add their own bookings and online orders. */
@Service
@RequiredArgsConstructor
public class CustomerService {

    private static final String BAD_LOGIN = "Wrong email / mobile number or password";

    private final CustomerAccountRepository repository;
    private final PasswordEncoder passwordEncoder;
    private final TokenService tokenService;
    private final LoginAttemptService loginAttemptService;
    private final BookingRepository bookingRepository;
    private final FoodOrderRepository orderRepository;

    public record Session(String token, CustomerAccount customer, long expiresAt) { }

    @Transactional
    public Session register(CustomerRegisterRequest r) {
        String email = r.getEmail().trim().toLowerCase(Locale.ROOT);
        if (repository.findByEmailIgnoreCase(email).isPresent()) {
            throw new BadRequestException("An account with this email already exists - please log in");
        }
        if (repository.findFirstByPhone(r.getPhone()).isPresent()) {
            throw new BadRequestException("An account with this mobile number already exists - please log in");
        }
        CustomerAccount c = repository.save(CustomerAccount.builder()
                .name(r.getName().trim())
                .email(email)
                .phone(r.getPhone())
                .passwordHash(passwordEncoder.encode(r.getPassword()))
                .lastLoginAt(LocalDateTime.now())
                .build());
        return session(c);
    }

    @Transactional
    public Session login(CustomerLoginRequest r) {
        String login = r.getLogin().trim();
        String key = "customer:" + login.toLowerCase(Locale.ROOT);
        if (loginAttemptService.isLocked(key)) {
            throw new UnauthorizedException("Too many failed attempts. Try again in 15 minutes.");
        }
        Optional<CustomerAccount> found = login.matches("[0-9]{10}")
                ? repository.findFirstByPhone(login) : repository.findByEmailIgnoreCase(login);
        boolean ok = found.isPresent() && Boolean.TRUE.equals(found.get().getActive())
                && passwordEncoder.matches(r.getPassword(), found.get().getPasswordHash());
        if (!ok) {
            loginAttemptService.recordFailure(key);
            throw new UnauthorizedException(BAD_LOGIN);
        }
        loginAttemptService.recordSuccess(key);
        CustomerAccount c = found.get();
        c.setLastLoginAt(LocalDateTime.now());
        repository.save(c);
        return session(c);
    }

    private Session session(CustomerAccount c) {
        long exp = tokenService.customerExpiryFromNow();
        return new Session(tokenService.createCustomerToken(c, exp), c, exp);
    }

    public List<Booking> bookings(CustomerAccount c) {
        return bookingRepository.findByCustomerIdOrderByCreatedAtDesc(c.getId());
    }

    public List<FoodOrder> orders(CustomerAccount c) {
        return orderRepository.findByCustomerIdOrderByCreatedAtDesc(c.getId());
    }

    /**
     * Adds a booking or order made as a guest to this account, using the secret code from its
     * confirmation / tracking link (BK... for bookings, HS... for orders).
     */
    @Transactional
    public Map<String, Object> claim(CustomerAccount c, String rawCode) {
        String code = rawCode == null ? "" : rawCode.trim();
        int slash = code.lastIndexOf('/');
        if (slash >= 0) {
            code = code.substring(slash + 1); // a whole link was pasted
        }
        Optional<Booking> b = bookingRepository.findByTrackingCode(code);
        if (b.isPresent()) {
            Booking booking = b.get();
            requireFree(booking.getCustomerId(), c);
            booking.setCustomerId(c.getId());
            bookingRepository.save(booking);
            return Map.of("type", "BOOKING", "id", booking.getId());
        }
        Optional<FoodOrder> o = orderRepository.findByTrackingCode(code);
        if (o.isPresent()) {
            FoodOrder order = o.get();
            requireFree(order.getCustomerId(), c);
            order.setCustomerId(c.getId());
            orderRepository.save(order);
            return Map.of("type", "ORDER", "id", order.getId());
        }
        throw new ResourceNotFoundException("No booking or order found for this code. Check the link in your confirmation.");
    }

    private static void requireFree(Long owner, CustomerAccount c) {
        if (owner != null && !owner.equals(c.getId())) {
            throw new BadRequestException("This is already linked to another account");
        }
    }
}
