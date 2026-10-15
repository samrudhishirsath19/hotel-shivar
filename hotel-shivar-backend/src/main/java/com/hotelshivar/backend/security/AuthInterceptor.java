package com.hotelshivar.backend.security;

import com.hotelshivar.backend.entity.AdminUser;
import com.hotelshivar.backend.entity.CustomerAccount;
import com.hotelshivar.backend.repository.AdminUserRepository;
import com.hotelshivar.backend.repository.CustomerAccountRepository;
import com.hotelshivar.backend.service.ModuleAccessService;
import com.hotelshivar.backend.service.TokenService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.io.IOException;
import java.util.Optional;

/**
 * Checks every /api request against AccessPolicy.
 * The user is re-read from the database on each protected call, so a deactivated user
 * or a changed department takes effect immediately (not only after the token expires).
 * <p>
 * Two kinds of login: staff (dashboard) and customer (website account). A customer token is never accepted
 * for staff URLs and a staff token never for customer URLs - even if both use the same email address.
 */
@Component
@RequiredArgsConstructor
public class AuthInterceptor implements HandlerInterceptor {

    public static final String USER_ATTRIBUTE = "authUser";
    public static final String CLAIMS_ATTRIBUTE = "authClaims";
    /** The logged-in customer account (customer URLs, and public URLs when a customer is logged in). */
    public static final String CUSTOMER_ATTRIBUTE = "authCustomer";

    private final TokenService tokenService;
    private final AdminUserRepository adminUserRepository;
    private final CustomerAccountRepository customerRepository;
    private final AccessPolicy accessPolicy;
    private final ModuleAccessService moduleAccess;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler)
            throws IOException {

        AccessPolicy.Rule rule = accessPolicy.rule(request.getMethod(), request.getRequestURI(), request::getParameter);
        Optional<TokenService.TokenClaims> claims = claims(request);

        if (rule.open()) {
            // public URL; remember a logged-in customer so a booking / order is added to their account
            customer(claims).ifPresent(c -> request.setAttribute(CUSTOMER_ATTRIBUTE, c));
            return true;
        }

        if (rule.customer()) {
            Optional<CustomerAccount> c = customer(claims);
            if (c.isPresent()) {
                request.setAttribute(CUSTOMER_ATTRIBUTE, c.get());
                return true;
            }
            boolean staffLogin = claims.isPresent() && !claims.get().isCustomer();
            if (!rule.staffToo() || !staffLogin) {
                return reject(response, HttpServletResponse.SC_UNAUTHORIZED, "Please log in to your account");
            }
            // staff allowed too (e.g. reception booking for a guest): checked below like any staff URL
        }

        Optional<AdminUser> user = claims
                .filter(cl -> !cl.isCustomer())
                .flatMap(cl -> adminUserRepository.findByEmailIgnoreCase(cl.email()))
                .filter(u -> Boolean.TRUE.equals(u.getActive()));
        claims.ifPresent(cl -> request.setAttribute(CLAIMS_ATTRIBUTE, cl));

        if (user.isEmpty()) {
            return reject(response, HttpServletResponse.SC_UNAUTHORIZED, "Please log in to continue");
        }
        // department role + the permissions the super admin has granted it (Module Access page)
        if (!rule.allows(user.get().getRole(), moduleAccess::has)) {
            return reject(response, HttpServletResponse.SC_FORBIDDEN, "You do not have permission for this action");
        }

        request.setAttribute(USER_ATTRIBUTE, user.get());
        return true;
    }

    private Optional<TokenService.TokenClaims> claims(HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        if (header == null || !header.startsWith("Bearer ")) {
            return Optional.empty();
        }
        return tokenService.verify(header.substring(7).trim());
    }

    private Optional<CustomerAccount> customer(Optional<TokenService.TokenClaims> claims) {
        return claims.filter(TokenService.TokenClaims::isCustomer)
                .flatMap(cl -> customerRepository.findByEmailIgnoreCase(cl.email()))
                .filter(c -> Boolean.TRUE.equals(c.getActive()));
    }

    private boolean reject(HttpServletResponse response, int status, String message) throws IOException {
        response.setStatus(status);
        response.setContentType("application/json");
        response.getWriter().write("{\"status\":" + status + ",\"message\":\"" + message + "\"}");
        return false;
    }
}
