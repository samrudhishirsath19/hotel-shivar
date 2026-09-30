package com.hotelshivar.backend.service;

import com.hotelshivar.backend.entity.AdminUser;
import com.hotelshivar.backend.entity.ModuleAccess;
import com.hotelshivar.backend.entity.StaffPermission;
import com.hotelshivar.backend.entity.enums.AppModule;
import com.hotelshivar.backend.entity.enums.AppPermission;
import com.hotelshivar.backend.exception.BadRequestException;
import com.hotelshivar.backend.repository.ModuleAccessRepository;
import com.hotelshivar.backend.repository.StaffPermissionRepository;
import com.hotelshivar.backend.security.Roles;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.EnumSet;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Which department has which permission (sub-module / action) - Module Access page.
 * Saved in the staff_permissions table and kept in memory, because it is checked on every protected API call.
 * The super admin always has every permission.
 * <p>
 * The first time a permission is missing for a department, its starting value comes from the older
 * whole-module setting (module_access table), so nobody's access changes when sub-permissions are introduced.
 */
@Service
@RequiredArgsConstructor
public class ModuleAccessService {

    /** Departments whose access can be changed (not the super admin). */
    public static final List<String> ROLES =
            List.of(Roles.MANAGER, Roles.RECEPTION, Roles.RESTAURANT, Roles.KITCHEN, Roles.BILLING);

    private final StaffPermissionRepository repository;
    private final ModuleAccessRepository moduleRepository;

    /** role -> permissions it has; null until first loaded. */
    private volatile Map<String, Set<AppPermission>> cache;

    public boolean has(String role, AppPermission permission) {
        if (Roles.SUPER_ADMIN.equals(role)) {
            return true;
        }
        Set<AppPermission> s = grants().get(role);
        return s != null && s.contains(permission);
    }

    /** role -> permissions, for every department. */
    public Map<String, Set<AppPermission>> grants() {
        Map<String, Set<AppPermission>> c = cache;
        if (c == null) {
            synchronized (this) {
                if (cache == null) {
                    cache = load();
                }
                c = cache;
            }
        }
        return c;
    }

    public Set<AppPermission> permissionsOf(String role) {
        if (Roles.SUPER_ADMIN.equals(role)) {
            return EnumSet.allOf(AppPermission.class);
        }
        return grants().getOrDefault(role, EnumSet.noneOf(AppPermission.class));
    }

    @Transactional
    public void set(String role, AppPermission permission, boolean enabled, AdminUser by) {
        if (!ROLES.contains(role)) {
            throw new BadRequestException("Access can only be changed for: Manager, Reception, Captain, Kitchen, Billing");
        }
        grants(); // make sure every row exists first
        StaffPermission row = repository.findByRoleAndPermission(role, permission)
                .orElseGet(() -> StaffPermission.builder().role(role).permission(permission).build());
        row.setEnabled(enabled);
        row.setUpdatedAt(LocalDateTime.now());
        row.setUpdatedBy(by != null ? by.getName() : null);
        repository.save(row);
        cache = null; // reload on next check - takes effect on the very next request
    }

    /** Last change, for the page footer. */
    public StaffPermission lastChange() {
        return repository.findAll().stream()
                .filter(m -> m.getUpdatedAt() != null)
                .max((a, b) -> a.getUpdatedAt().compareTo(b.getUpdatedAt()))
                .orElse(null);
    }

    // ------------------------------------------------------------------ loading / starting values

    private Map<String, Set<AppPermission>> load() {
        applyDefaultChanges();
        Map<String, StaffPermission> rows = new HashMap<>();
        for (StaffPermission p : repository.findAll()) {
            rows.put(p.getRole() + ":" + p.getPermission(), p);
        }
        Map<String, Boolean> modules = null; // read only when a starting value is needed
        Map<String, Set<AppPermission>> out = new ConcurrentHashMap<>();
        for (String role : ROLES) {
            Set<AppPermission> set = EnumSet.noneOf(AppPermission.class);
            for (AppPermission p : AppPermission.values()) {
                StaffPermission row = rows.get(role + ":" + p);
                if (row == null) {
                    if (modules == null) {
                        modules = moduleSettings();
                    }
                    boolean hasModule = modules.getOrDefault(role + ":" + p.module(), p.module().defaultRoles().contains(role));
                    row = repository.save(StaffPermission.builder().role(role).permission(p)
                            .enabled(p.startsOn(role, hasModule)).build());
                }
                if (Boolean.TRUE.equals(row.getEnabled())) {
                    set.add(p);
                }
            }
            out.put(role, Collections.unmodifiableSet(set));
        }
        return out;
    }

    /** The older whole-module setting per department ("ROLE:MODULE" -> on/off). */
    private Map<String, Boolean> moduleSettings() {
        Map<String, Boolean> m = new LinkedHashMap<>();
        for (ModuleAccess a : moduleRepository.findAll()) {
            m.put(a.getRole() + ":" + a.getModule(), Boolean.TRUE.equals(a.getEnabled()));
        }
        return m;
    }

    /**
     * Default changes made after module access was first saved (only while the old row still holds its
     * original default, i.e. a super admin never switched it):
     *   - The manager no longer has Room Booking.
     */
    private void applyDefaultChanges() {
        moduleRepository.findByRoleAndModule(Roles.MANAGER, AppModule.ROOM_BOOKING)
                .filter(row -> row.getUpdatedAt() == null && Boolean.TRUE.equals(row.getEnabled()))
                .ifPresent(row -> {
                    row.setEnabled(false);
                    row.setUpdatedAt(LocalDateTime.now());
                    row.setUpdatedBy("System (default changed)");
                    moduleRepository.save(row);
                });
    }
}
