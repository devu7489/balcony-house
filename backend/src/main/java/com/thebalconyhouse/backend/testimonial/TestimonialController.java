package com.thebalconyhouse.backend.testimonial;

import com.thebalconyhouse.backend.testimonial.dto.TestimonialDto;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

// Public, no-auth (see SecurityConfig: /api/testimonials/** -> permitAll on GET).
@RestController
@RequestMapping("/api/testimonials")
public class TestimonialController {

    private final TestimonialService testimonialService;

    public TestimonialController(TestimonialService testimonialService) {
        this.testimonialService = testimonialService;
    }

    @GetMapping
    public List<TestimonialDto> all() {
        return testimonialService.findAll();
    }

    @GetMapping("/featured")
    public List<TestimonialDto> featured() {
        return testimonialService.findFeatured();
    }
}
