package com.thebalconyhouse.backend.cafe;

import com.thebalconyhouse.backend.cafe.dto.CafeItemDto;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.List;

@RestController
@RequestMapping("/api/cafe")
public class CafeController {
    private final CafeRepository repository;
    public CafeController(CafeRepository repository) { this.repository = repository; }

    @GetMapping
    public List<CafeItemDto> all() {
        return repository.findAll().stream().map(CafeItemDto::from).toList();
    }
}
