package com.hotelshivar.backend.controller;

import com.hotelshivar.backend.dto.UserRequest;
import com.hotelshivar.backend.dto.UserResponse;
import com.hotelshivar.backend.entity.AdminUser;
import com.hotelshivar.backend.security.AuthInterceptor;
import com.hotelshivar.backend.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Super admin only: create and manage the department logins. */
@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping
    public List<UserResponse> list() {
        return userService.list();
    }

    @PostMapping
    public ResponseEntity<UserResponse> create(@Valid @RequestBody UserRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(userService.create(request));
    }

    @PutMapping("/{id}")
    public UserResponse update(@PathVariable Long id,
                               @Valid @RequestBody UserRequest request,
                               @RequestAttribute(AuthInterceptor.USER_ATTRIBUTE) AdminUser me) {
        return userService.update(id, request, me);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id,
                                       @RequestAttribute(AuthInterceptor.USER_ATTRIBUTE) AdminUser me) {
        userService.delete(id, me);
        return ResponseEntity.noContent().build();
    }
}
