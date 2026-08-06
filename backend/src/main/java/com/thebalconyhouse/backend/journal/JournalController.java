package com.thebalconyhouse.backend.journal;

import com.thebalconyhouse.backend.common.ResourceNotFoundException;
import com.thebalconyhouse.backend.journal.dto.JournalPostDto;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/journal")
public class JournalController {
    private final JournalRepository repository;
    public JournalController(JournalRepository repository) { this.repository = repository; }

    @GetMapping
    public List<JournalPostDto> all() {
        return repository.findAll().stream().map(JournalPostDto::summary).toList();
    }

    @GetMapping("/{slug}")
    public JournalPostDto one(@PathVariable String slug) {
        return repository.findBySlug(slug)
                .map(JournalPostDto::full)
                .orElseThrow(() -> new ResourceNotFoundException("Journal post '" + slug + "' not found"));
    }
}
