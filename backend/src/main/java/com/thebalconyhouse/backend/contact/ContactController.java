package com.thebalconyhouse.backend.contact;

import com.thebalconyhouse.backend.contact.dto.ContactRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;

@RestController
@RequestMapping("/api/contact")
public class ContactController {
    private final ContactRepository repository;
    public ContactController(ContactRepository repository) { this.repository = repository; }

    @PostMapping
    public ResponseEntity<Void> submit(@Valid @RequestBody ContactRequest request) {
        repository.save(new ContactEnquiry(request.name(), request.email(), request.message(), Instant.now()));
        return ResponseEntity.accepted().build();
    }
}
