package com.thebalconyhouse.backend.contact;

import com.thebalconyhouse.backend.contact.dto.ContactDto;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin/contact")
public class AdminContactController {
    private final ContactRepository repository;
    public AdminContactController(ContactRepository repository) { this.repository = repository; }

    @GetMapping
    public List<ContactDto> all() {
        return repository.findAllByOrderBySubmittedAtDesc().stream()
                .map(e -> new ContactDto(e.getId(), e.getName(), e.getEmail(), e.getMessage(), e.getSubmittedAt()))
                .toList();
    }
}
