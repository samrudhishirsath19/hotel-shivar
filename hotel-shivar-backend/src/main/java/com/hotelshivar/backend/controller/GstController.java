package com.hotelshivar.backend.controller;

import com.hotelshivar.backend.dto.GstSettingsRequest;
import com.hotelshivar.backend.entity.GstSettings;
import com.hotelshivar.backend.service.GstService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

/**
 * GST settings. Reading is public (the website shows the GST on the cart and the booking window);
 * changing them is super admin only (see AccessPolicy).
 */
@RestController
@RequiredArgsConstructor
public class GstController {

    private final GstService gstService;

    @GetMapping("/api/gst")
    public GstSettings get() {
        return gstService.settings();
    }

    @PutMapping("/api/admin/gst")
    public GstSettings update(@Valid @RequestBody GstSettingsRequest request) {
        return gstService.update(request);
    }
}
