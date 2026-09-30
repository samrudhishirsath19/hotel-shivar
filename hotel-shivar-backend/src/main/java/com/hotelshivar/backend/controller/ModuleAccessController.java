package com.hotelshivar.backend.controller;

import com.hotelshivar.backend.entity.AdminUser;
import com.hotelshivar.backend.entity.StaffPermission;
import com.hotelshivar.backend.entity.enums.AppModule;
import com.hotelshivar.backend.entity.enums.AppPermission;
import com.hotelshivar.backend.security.AuthInterceptor;
import com.hotelshivar.backend.service.ModuleAccessService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Module Access: which department has which permission (sub-module / action), grouped by module.
 * Everyone reads it (the screens show only what the user may use), the super admin changes it.
 */
@RestController
@RequestMapping("/api/admin/module-access")
@RequiredArgsConstructor
public class ModuleAccessController {

    private final ModuleAccessService service;

    public record PermissionInfo(AppPermission permission, String label, String description) { }

    public record ModuleInfo(AppModule module, String label, String description, List<PermissionInfo> permissions) { }

    /** roles: departments that can be changed; grants: role -> its permissions; mine: the caller's permissions. */
    public record Matrix(List<ModuleInfo> modules, List<String> roles, Map<String, Set<AppPermission>> grants,
                         Set<AppPermission> mine, LocalDateTime updatedAt, String updatedBy) { }

    @Data
    public static class Toggle {
        @NotNull(message = "Choose on or off")
        private Boolean enabled;
    }

    @GetMapping
    public Matrix get(@RequestAttribute(AuthInterceptor.USER_ATTRIBUTE) AdminUser me) {
        List<ModuleInfo> modules = Arrays.stream(AppModule.values())
                .map(m -> new ModuleInfo(m, m.label(), m.description(), Arrays.stream(AppPermission.values())
                        .filter(p -> p.module() == m)
                        .map(p -> new PermissionInfo(p, p.label(), p.description()))
                        .toList()))
                .toList();
        Map<String, Set<AppPermission>> grants = new LinkedHashMap<>();
        for (String role : ModuleAccessService.ROLES) {
            grants.put(role, service.permissionsOf(role));
        }
        StaffPermission last = service.lastChange();
        return new Matrix(modules, ModuleAccessService.ROLES, grants, service.permissionsOf(me.getRole()),
                last != null ? last.getUpdatedAt() : null, last != null ? last.getUpdatedBy() : null);
    }

    @PutMapping("/{role}/{permission}")
    public Matrix set(@PathVariable String role, @PathVariable AppPermission permission, @Valid @RequestBody Toggle body,
                      @RequestAttribute(AuthInterceptor.USER_ATTRIBUTE) AdminUser me) {
        service.set(role.trim().toUpperCase(), permission, body.getEnabled(), me);
        return get(me);
    }
}
