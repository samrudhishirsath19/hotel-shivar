package com.hotelshivar.backend.controller;

import com.hotelshivar.backend.exception.BadRequestException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Map;
import java.util.UUID;

/**
 * Super admin: upload a room photo from the device. The file is saved in app.upload-dir and
 * the answer is the address to store in the room's imageUrl (e.g. /uploads/3f2c....jpg).
 * Not listed in AccessPolicy, so it is super admin only.
 */
@RestController
@RequestMapping("/api/admin/uploads")
public class UploadController {

    private static final Map<String, String> EXTENSIONS = Map.of(
            "image/jpeg", ".jpg",
            "image/png", ".png",
            "image/webp", ".webp",
            "image/gif", ".gif");

    @Value("${app.upload-dir:uploads}")
    private String uploadDir;

    @PostMapping
    public ResponseEntity<Map<String, String>> upload(@RequestParam("file") MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Please choose an image to upload");
        }
        String ext = EXTENSIONS.get(String.valueOf(file.getContentType()).toLowerCase());
        if (ext == null) {
            throw new BadRequestException("Only JPG, PNG, WEBP or GIF images can be uploaded");
        }
        Path dir = Paths.get(uploadDir).toAbsolutePath().normalize();
        Files.createDirectories(dir);
        String name = UUID.randomUUID() + ext;
        try (InputStream in = file.getInputStream()) {
            Files.copy(in, dir.resolve(name), StandardCopyOption.REPLACE_EXISTING);
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("url", "/uploads/" + name));
    }
}
