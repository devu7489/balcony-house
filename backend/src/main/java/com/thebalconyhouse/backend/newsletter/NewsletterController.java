package com.thebalconyhouse.backend.newsletter;

import com.thebalconyhouse.backend.newsletter.dto.NewsletterRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;

@RestController
@RequestMapping("/api/newsletter")
public class NewsletterController {
    private final NewsletterRepository repository;
    public NewsletterController(NewsletterRepository repository) { this.repository = repository; }

    @PostMapping("/subscribe")
    public ResponseEntity<Void> subscribe(@Valid @RequestBody NewsletterRequest request) {
        if (repository.findByEmail(request.email()).isEmpty()) {
            repository.save(new NewsletterSubscriber(request.email(), Instant.now()));
        }
        return ResponseEntity.accepted().build();
    }
}
