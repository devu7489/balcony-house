package com.thebalconyhouse.backend.newsletter;

import com.thebalconyhouse.backend.newsletter.dto.NewsletterSubscriberDto;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin/newsletter")
public class AdminNewsletterController {
    private final NewsletterRepository repository;
    public AdminNewsletterController(NewsletterRepository repository) { this.repository = repository; }

    @GetMapping
    public List<NewsletterSubscriberDto> all() {
        return repository.findAllByOrderBySubscribedAtDesc().stream()
                .map(s -> new NewsletterSubscriberDto(s.getId(), s.getEmail(), s.getSubscribedAt()))
                .toList();
    }
}
