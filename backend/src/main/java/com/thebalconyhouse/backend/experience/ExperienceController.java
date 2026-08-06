package com.thebalconyhouse.backend.experience;

import com.thebalconyhouse.backend.experience.dto.ExperienceDto;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.List;

@RestController
@RequestMapping("/api/experiences")
public class ExperienceController {
    private final ExperienceRepository repository;
    public ExperienceController(ExperienceRepository repository) { this.repository = repository; }

    @GetMapping
    public List<ExperienceDto> all() {
        return repository.findAll().stream().map(ExperienceDto::from).toList();
    }
}
