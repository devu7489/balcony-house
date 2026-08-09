package com.thebalconyhouse.backend.testimonial;

import com.thebalconyhouse.backend.testimonial.dto.TestimonialDto;
import com.thebalconyhouse.backend.testimonial.dto.TestimonialRequest;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

// Requires ROLE_ADMIN (see SecurityConfig: /api/admin/** -> hasRole("ADMIN")).
@RestController
@RequestMapping("/api/admin/testimonials")
public class AdminTestimonialController {

    private final TestimonialService testimonialService;

    public AdminTestimonialController(TestimonialService testimonialService) {
        this.testimonialService = testimonialService;
    }

    @GetMapping
    public List<TestimonialDto> all() {
        return testimonialService.findAll();
    }

    @PostMapping
    public TestimonialDto create(@Valid @RequestBody TestimonialRequest request) {
        return testimonialService.create(request);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        testimonialService.delete(id);
    }
}
