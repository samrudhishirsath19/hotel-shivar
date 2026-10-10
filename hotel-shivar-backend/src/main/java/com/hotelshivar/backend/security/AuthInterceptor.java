package com.hotelshivar.backend.security;

import com.hotelshivar.backend.entity.AdminUser;
import com.hotelshivar.backend.repository.AdminUserRepository;
<<<<<<< HEAD
import com.hotelshivar.backend.service.ModuleAccessService;
=======
>>>>>>> origin/sakshi
import com.hotelshivar.backend.service.TokenService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.io.IOException;
import java.util.Optional;
<<<<<<< HEAD
=======
import java.util.Set;
>>>>>>> origin/sakshi

/**
 * Checks every /api request against AccessPolicy.
 * The user is re-read from the database on each protected call, so a deactivated user
 * or a changed department takes effect immediately (not only after the token expires).
 */
@Component
@RequiredArgsConstructor
public class AuthInterceptor implements HandlerInterceptor {

    public static final String USER_ATTRIBUTE = "authUser";
    public static final String CLAIMS_ATTRIBUTE = "authClaims";

    private final TokenService tokenService;
    private final AdminUserRepository adminUserRepository;
    private final AccessPolicy accessPolicy;
<<<<<<< HEAD
    private final ModuleAccessService moduleAccess;
=======
>>>>>>> origin/sakshi

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler)
            throws IOException {

<<<<<<< HEAD
        AccessPolicy.Rule rule = accessPolicy.rule(request.getMethod(), request.getRequestURI(), request::getParameter);
        if (rule.open()) {
=======
        Set<String> allowedRoles = accessPolicy.requiredRoles(request.getMethod(), request.getRequestURI());
        if (allowedRoles == null) {
>>>>>>> origin/sakshi
            return true; // public URL
        }

        Optional<AdminUser> user = Optional.empty();
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            var claims = tokenService.verify(header.substring(7).trim());
            if (claims.isPresent()) {
                request.setAttribute(CLAIMS_ATTRIBUTE, claims.get());
                user = adminUserRepository.findByEmailIgnoreCase(claims.get().email())
                        .filter(u -> Boolean.TRUE.equals(u.getActive()));
            }
        }

        if (user.isEmpty()) {
            return reject(response, HttpServletResponse.SC_UNAUTHORIZED, "Please log in to continue");
        }
<<<<<<< HEAD
        // department role + the permissions the super admin has granted it (Module Access page)
        if (!rule.allows(user.get().getRole(), moduleAccess::has)) {
=======
        if (!allowedRoles.contains(user.get().getRole())) {
>>>>>>> origin/sakshi
            return reject(response, HttpServletResponse.SC_FORBIDDEN, "You do not have permission for this action");
        }

        request.setAttribute(USER_ATTRIBUTE, user.get());
        return true;
    }

    private boolean reject(HttpServletResponse response, int status, String message) throws IOException {
        response.setStatus(status);
        response.setContentType("application/json");
        response.getWriter().write("{\"status\":" + status + ",\"message\":\"" + message + "\"}");
        return false;
    }
}
