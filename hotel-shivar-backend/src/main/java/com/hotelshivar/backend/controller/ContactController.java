package com.hotelshivar.backend.controller;

import com.hotelshivar.backend.dto.ContactRequest;
import com.hotelshivar.backend.entity.ContactMessage;
import com.hotelshivar.backend.service.ContactService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/contact")
@RequiredArgsConstructor
public class ContactController {

    private final ContactService contactService;

    @PostMapping
    public ResponseEntity<ContactMessage> submit(@Valid @RequestBody ContactRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(contactService.submitMessage(request));
    }

    @GetMapping
    public List<ContactMessage> getAll() {
        return contactService.getAllMessages();
    }

    /** Staff (Guest enquiries permission): mark handled / open again. */
    @PatchMapping("/{id}/resolved")
    public ContactMessage resolve(@PathVariable Long id, @RequestParam boolean resolved) {
        return contactService.setResolved(id, resolved);
    }
}
