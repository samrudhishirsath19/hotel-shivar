package com.hotelshivar.backend.service;

import com.hotelshivar.backend.dto.UserRequest;
import com.hotelshivar.backend.dto.UserResponse;
import com.hotelshivar.backend.entity.AdminUser;
import com.hotelshivar.backend.exception.BadRequestException;
import com.hotelshivar.backend.exception.ResourceNotFoundException;
import com.hotelshivar.backend.repository.AdminUserRepository;
import com.hotelshivar.backend.security.Roles;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {

    private static final int MIN_PASSWORD = 8;

    private final AdminUserRepository adminUserRepository;
    private final PasswordEncoder passwordEncoder;

    public List<UserResponse> list() {
        return adminUserRepository.findAll().stream().map(UserResponse::from).toList();
    }

    public UserResponse create(UserRequest r) {
        String email = r.getEmail().trim();
        if (adminUserRepository.findByEmailIgnoreCase(email).isPresent()) {
            throw new BadRequestException("A user with this email already exists");
        }
        checkPassword(r.getPassword(), true);

        AdminUser user = AdminUser.builder()
                .email(email)
                .name(r.getName().trim())
                .role(r.getRole())
                .passwordHash(passwordEncoder.encode(r.getPassword()))
                .active(r.getActive() == null || r.getActive())
                .build();
        return UserResponse.from(adminUserRepository.save(user));
    }

    /** Email cannot be changed (it is the login id). Empty password = keep the old one. */
    public UserResponse update(Long id, UserRequest r, AdminUser me) {
        AdminUser user = adminUserRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        boolean active = r.getActive() == null || r.getActive();
        if (user.getId().equals(me.getId()) && (!active || !Roles.SUPER_ADMIN.equals(r.getRole()))) {
            throw new BadRequestException("You cannot deactivate yourself or remove your own super admin access");
        }

        user.setName(r.getName().trim());
        user.setRole(r.getRole());
        user.setActive(active);
        if (r.getPassword() != null && !r.getPassword().isBlank()) {
            checkPassword(r.getPassword(), false);
            user.setPasswordHash(passwordEncoder.encode(r.getPassword()));
        }
        return UserResponse.from(adminUserRepository.save(user));
    }

    public void delete(Long id, AdminUser me) {
        AdminUser user = adminUserRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
        if (user.getId().equals(me.getId())) {
            throw new BadRequestException("You cannot delete your own account");
        }
        adminUserRepository.delete(user);
    }

    private void checkPassword(String password, boolean required) {
        if (password == null || password.isBlank()) {
            if (required) throw new BadRequestException("Password is required");
            return;
        }
        if (password.length() < MIN_PASSWORD) {
            throw new BadRequestException("Password must be at least " + MIN_PASSWORD + " characters");
        }
    }
}
