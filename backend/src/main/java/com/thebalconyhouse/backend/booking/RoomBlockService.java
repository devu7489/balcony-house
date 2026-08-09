package com.thebalconyhouse.backend.booking;

import com.thebalconyhouse.backend.booking.dto.RoomBlockDto;
import com.thebalconyhouse.backend.common.ResourceNotFoundException;
import com.thebalconyhouse.backend.property.Property;
import com.thebalconyhouse.backend.property.PropertyRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class RoomBlockService {

    private final RoomBlockRepository roomBlockRepository;
    private final PropertyRepository propertyRepository;

    public RoomBlockService(RoomBlockRepository roomBlockRepository, PropertyRepository propertyRepository) {
        this.roomBlockRepository = roomBlockRepository;
        this.propertyRepository = propertyRepository;
    }

    public List<RoomBlockDto> findAll() {
        List<RoomBlock> blocks = roomBlockRepository.findAllByOrderByStartDateAsc();
        Map<Long, Property> propertiesById = propertyRepository.findAllById(
                blocks.stream().map(RoomBlock::getPropertyId).distinct().toList()
        ).stream().collect(Collectors.toMap(Property::getId, p -> p));
        return blocks.stream().map(b -> toDto(b, propertiesById.get(b.getPropertyId()))).toList();
    }

    @Transactional
    public RoomBlockDto create(Long propertyId, java.time.LocalDate startDate, java.time.LocalDate endDate, String reason) {
        if (!endDate.isAfter(startDate)) {
            throw new IllegalArgumentException("End date must be after start date");
        }
        Property property = propertyRepository.findById(propertyId)
                .orElseThrow(() -> new ResourceNotFoundException("Property " + propertyId + " not found"));
        RoomBlock saved = roomBlockRepository.save(new RoomBlock(propertyId, startDate, endDate, reason, Instant.now()));
        return toDto(saved, property);
    }

    @Transactional
    public void delete(Long id) {
        if (!roomBlockRepository.existsById(id)) {
            throw new ResourceNotFoundException("Room block " + id + " not found");
        }
        roomBlockRepository.deleteById(id);
    }

    private RoomBlockDto toDto(RoomBlock b, Property property) {
        return new RoomBlockDto(b.getId(), b.getPropertyId(), property != null ? property.getName() : null,
                b.getStartDate(), b.getEndDate(), b.getReason(), b.getCreatedAt());
    }
}
