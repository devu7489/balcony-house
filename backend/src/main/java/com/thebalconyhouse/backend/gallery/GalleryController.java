package com.thebalconyhouse.backend.gallery;

import com.thebalconyhouse.backend.gallery.dto.GalleryImageDto;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.List;

@RestController
@RequestMapping("/api/gallery")
public class GalleryController {
    private final GalleryRepository repository;
    public GalleryController(GalleryRepository repository) { this.repository = repository; }

    @GetMapping
    public List<GalleryImageDto> all() {
        return repository.findAllByOrderBySortOrderAsc().stream().map(GalleryImageDto::from).toList();
    }
}
