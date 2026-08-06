package com.thebalconyhouse.backend.property;

import com.thebalconyhouse.backend.common.ResourceNotFoundException;
import com.thebalconyhouse.backend.property.dto.PropertyDto;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class PropertyService {

    private final PropertyRepository repository;

    public PropertyService(PropertyRepository repository) {
        this.repository = repository;
    }

    public List<PropertyDto> findAll() {
        return repository.findAll().stream().map(this::toDto).toList();
    }

    public PropertyDto findById(Long id) {
        Property property = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Property " + id + " not found"));
        return toDto(property);
    }

    private PropertyDto toDto(Property p) {
        return new PropertyDto(p.getId(), p.getName(), p.getDescription(), p.getPricePerNight(),
                p.getMaxGuests(), p.isPrivateBalcony(), p.isWorkspaceAvailable(), p.getHeroImageUrl(),
                List.copyOf(p.getHighlights()));
    }
}
