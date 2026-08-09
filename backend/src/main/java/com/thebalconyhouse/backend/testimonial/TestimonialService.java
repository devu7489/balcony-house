package com.thebalconyhouse.backend.testimonial;

import com.thebalconyhouse.backend.common.ResourceNotFoundException;
import com.thebalconyhouse.backend.testimonial.dto.TestimonialDto;
import com.thebalconyhouse.backend.testimonial.dto.TestimonialRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
@Transactional(readOnly = true)
public class TestimonialService {

    private final TestimonialRepository repository;

    public TestimonialService(TestimonialRepository repository) {
        this.repository = repository;
    }

    public List<TestimonialDto> findAll() {
        return repository.findAllByOrderByCreatedAtDesc().stream().map(this::toDto).toList();
    }

    public List<TestimonialDto> findFeatured() {
        return repository.findByFeaturedTrueOrderByCreatedAtDesc().stream().map(this::toDto).toList();
    }

    @Transactional
    public TestimonialDto create(TestimonialRequest request) {
        Testimonial saved = repository.save(new Testimonial(
                request.guestName(), request.quote(), request.rating(), request.roomStayed(),
                request.stayDate(), request.featured(), Instant.now()
        ));
        return toDto(saved);
    }

    @Transactional
    public void delete(Long id) {
        if (!repository.existsById(id)) {
            throw new ResourceNotFoundException("Testimonial " + id + " not found");
        }
        repository.deleteById(id);
    }

    private TestimonialDto toDto(Testimonial t) {
        return new TestimonialDto(t.getId(), t.getGuestName(), t.getQuote(), t.getRating(), t.getRoomStayed(),
                t.getStayDate(), t.isFeatured(), t.getCreatedAt());
    }
}
