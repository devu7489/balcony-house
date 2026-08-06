package com.thebalconyhouse.backend.property;

import com.thebalconyhouse.backend.property.dto.PropertyDto;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/properties")
public class PropertyController {

    private final PropertyService service;

    public PropertyController(PropertyService service) {
        this.service = service;
    }

    @GetMapping
    public List<PropertyDto> all() {
        return service.findAll();
    }

    @GetMapping("/{id}")
    public PropertyDto one(@PathVariable Long id) {
        return service.findById(id);
    }
}
